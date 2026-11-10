package com.balancevault.dto;

import com.balancevault.entity.AuditLog;
import java.time.Instant;
import java.util.List;

public class AuditDTOs {

    public record AuditLogDto(
            String id,
            String actorId,
            String actorRole,
            String action,
            String entityType,
            String entityId,
            String details,
            String ipAddress,
            Instant timestamp
    ) {
        public static AuditLogDto from(AuditLog log) {
            return new AuditLogDto(
                    log.getId(),
                    log.getActorId(),
                    log.getActorRole(),
                    log.getAction(),
                    log.getEntityType(),
                    log.getEntityId(),
                    log.getDetails(),
                    log.getIpAddress(),
                    log.getTimestamp()
            );
        }
    }

    public record AuditListResponse(
            List<AuditLogDto> logs,
            int page,
            int perPage,
            long totalElements,
            int totalPages
    ) {}
}
