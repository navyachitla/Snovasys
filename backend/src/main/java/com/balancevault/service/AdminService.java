package com.balancevault.service;

import com.balancevault.dto.AdminDTOs.*;
import com.balancevault.dto.AuthDTOs.UserDto;
import com.balancevault.entity.Invitation;
import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import com.balancevault.exception.CustomExceptions.*;
import com.balancevault.repository.InvitationRepository;
import com.balancevault.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final AuditService auditService;

    public AdminService(UserRepository userRepository,
                        InvitationRepository invitationRepository,
                        AuditService auditService) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listUsers(int page, int perPage, String search, Role role, Boolean status) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), perPage);
        Page<User> userPage = userRepository.searchUsers(role, status, search, pageRequest);

        return Map.of(
                "users", userPage.getContent().stream().map(UserDto::from).toList(),
                "page", page,
                "perPage", perPage,
                "totalElements", userPage.getTotalElements(),
                "totalPages", userPage.getTotalPages()
        );
    }

    @Transactional
    public UserDto updateUserStatus(String userId, boolean isActive, User admin, String clientIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("Administrators cannot deactivate their own account.");
        }

        user.setActive(isActive);
        user = userRepository.save(user);

        auditService.record(admin.getId(), admin.getRole().name(), "USER_STATUS_UPDATED",
                "USER", user.getId(),
                "Changed active status to: " + isActive + " for " + user.getEmail(),
                clientIp);

        return UserDto.from(user);
    }

    @Transactional
    public InvitationDto createInvitation(CreateInvitationRequest req, User admin, String clientIp) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("A user with email " + normalizedEmail + " already exists.");
        }

        Invitation invitation = new Invitation(normalizedEmail, req.fullName(), req.role(), admin.getId());
        invitation = invitationRepository.save(invitation);

        auditService.record(admin.getId(), admin.getRole().name(), "INVITATION_CREATED",
                "INVITATION", invitation.getId(),
                "Invited " + normalizedEmail + " with role " + req.role(),
                clientIp);

        return InvitationDto.from(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> listInvitations() {
        return invitationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(InvitationDto::from)
                .toList();
    }

    @Transactional
    public InvitationDto revokeInvitation(String invitationId, User admin, String clientIp) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found: " + invitationId));

        invitation.setRevoked(true);
        invitation = invitationRepository.save(invitation);

        auditService.record(admin.getId(), admin.getRole().name(), "INVITATION_REVOKED",
                "INVITATION", invitation.getId(),
                "Revoked invitation for " + invitation.getEmail(),
                clientIp);

        return InvitationDto.from(invitation);
    }
}
