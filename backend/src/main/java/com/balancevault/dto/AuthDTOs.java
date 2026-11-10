package com.balancevault.dto;

import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTOs {

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotBlank(message = "Valid email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 12, max = 72, message = "Password must be between 12 and 72 characters")
            String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record AcceptInvitationRequest(
            @NotBlank(message = "Invitation token is required")
            String token,

            @NotBlank(message = "Password is required")
            @Size(min = 12, max = 72, message = "Password must be between 12 and 72 characters")
            String password
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 12, max = 72, message = "New password must be between 12 and 72 characters")
            String newPassword
    ) {}

    public record UpdateProfileRequest(
            @NotBlank(message = "Full name is required")
            String fullName
    ) {}

    public record UserDto(
            String id,
            String fullName,
            String email,
            Role role,
            boolean isActive
    ) {
        public static UserDto from(User user) {
            return new UserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole(),
                    user.isActive()
            );
        }
    }

    public record AuthResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserDto user
    ) {
        public static AuthResponse of(String token, long expiresInSeconds, User user) {
            return new AuthResponse(token, "Bearer", expiresInSeconds, UserDto.from(user));
        }
    }
}
