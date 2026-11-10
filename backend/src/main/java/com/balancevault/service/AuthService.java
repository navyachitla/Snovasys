package com.balancevault.service;

import com.balancevault.config.JwtTokenProvider;
import com.balancevault.dto.AuthDTOs.*;
import com.balancevault.entity.Invitation;
import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import com.balancevault.exception.CustomExceptions.*;
import com.balancevault.repository.InvitationRepository;
import com.balancevault.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       InvitationRepository invitationRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req, String clientIp) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists.");
        }

        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(req.password()),
                req.name().trim(),
                Role.ACCOUNT_HOLDER
        );
        user = userRepository.save(user);

        auditService.record(user.getId(), user.getRole().name(), "USER_REGISTER",
                "USER", user.getId(), "User registered via public registration", clientIp);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.of(token, tokenProvider.getExpirationSeconds(), user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String clientIp) {
        String normalizedEmail = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("Your account has been deactivated. Please contact an administrator.");
        }

        auditService.record(user.getId(), user.getRole().name(), "USER_LOGIN",
                "USER", user.getId(), "User logged in successfully", clientIp);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.of(token, tokenProvider.getExpirationSeconds(), user);
    }

    @Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest req, String clientIp) {
        Invitation invitation = invitationRepository.findByToken(req.token())
                .orElseThrow(() -> new BadRequestException("Invalid or unrecognized invitation token."));

        if (invitation.isRevoked()) {
            throw new BadRequestException("This invitation has been revoked.");
        }
        if (invitation.isUsed()) {
            throw new BadRequestException("This invitation has already been accepted.");
        }
        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("This invitation has expired.");
        }

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new BadRequestException("A user with email " + invitation.getEmail() + " already exists.");
        }

        User user = new User(
                invitation.getEmail(),
                passwordEncoder.encode(req.password()),
                invitation.getFullName(),
                invitation.getRole()
        );
        user = userRepository.save(user);

        invitation.setUsed(true);
        invitationRepository.save(invitation);

        auditService.record(user.getId(), user.getRole().name(), "INVITATION_ACCEPTED",
                "USER", user.getId(), "User joined with role " + user.getRole(), clientIp);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.of(token, tokenProvider.getExpirationSeconds(), user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest req, String clientIp) {
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match.");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        auditService.record(user.getId(), user.getRole().name(), "PASSWORD_CHANGED",
                "USER", user.getId(), "Password was updated", clientIp);
    }

    @Transactional
    public UserDto updateProfile(User user, UpdateProfileRequest req, String clientIp) {
        user.setFullName(req.fullName().trim());
        user = userRepository.save(user);

        auditService.record(user.getId(), user.getRole().name(), "PROFILE_UPDATED",
                "USER", user.getId(), "Updated full name to: " + user.getFullName(), clientIp);

        return UserDto.from(user);
    }
}
