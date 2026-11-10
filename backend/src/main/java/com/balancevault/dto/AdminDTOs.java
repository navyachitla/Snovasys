package com.balancevault.dto;

import com.balancevault.entity.Invitation;
import com.balancevault.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class AdminDTOs {

    public record CreateInvitationRequest(
            @NotBlank(message = "Full name is required")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotNull(message = "Role is required")
            Role role
    ) {}

    public record InvitationDto(
            String id,
            String email,
            String fullName,
            Role role,
            String token,
            boolean isUsed,
            boolean isRevoked,
            Instant expiresAt,
            Instant createdAt
    ) {
        public static InvitationDto from(Invitation inv) {
            return new InvitationDto(
                    inv.getId(),
                    inv.getEmail(),
                    inv.getFullName(),
                    inv.getRole(),
                    inv.getToken(),
                    inv.isUsed(),
                    inv.isRevoked(),
                    inv.getExpiresAt(),
                    inv.getCreatedAt()
            );
        }
    }

    public record InvitationResponse(
            InvitationDto invitation
    ) {}

    public record InvitationListResponse(
            List<InvitationDto> invitations
    ) {}

    public record ApproveRequestDto(
            @NotBlank(message = "Account number is required")
            String accountNumber
    ) {}

    public record RejectRequestDto(
            String note
    ) {}

    public record UpdateStatusRequest(
            boolean isActive
    ) {}
}
