package com.balancevault.service;

import com.balancevault.dto.AuditDTOs;
import com.balancevault.entity.AuditLog;
import com.balancevault.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actorId, String actorRole, String action,
                       String entityType, String entityId, String details, String ipAddress) {
        AuditLog log = new AuditLog(actorId, actorRole, action, entityType, entityId, details, ipAddress);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public AuditDTOs.AuditListResponse getAuditLogs(int page, int perPage) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), perPage);
        Page<AuditLog> result = auditLogRepository.findAllByOrderByTimestampDesc(pageRequest);

        return new AuditDTOs.AuditListResponse(
                result.getContent().stream().map(AuditDTOs.AuditLogDto::from).toList(),
                page,
                perPage,
                result.getTotalElements(),
                result.getTotalPages()
        );
    }
}
