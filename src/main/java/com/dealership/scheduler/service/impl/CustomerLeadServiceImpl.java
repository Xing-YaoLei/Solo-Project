package com.dealership.scheduler.service.impl;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.LeadChangeLog;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.dto.LeadQueryDTO;
import com.dealership.scheduler.repository.CustomerLeadRepository;
import com.dealership.scheduler.repository.LeadChangeLogRepository;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.CustomerLeadService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerLeadServiceImpl implements CustomerLeadService {

    @Autowired
    private CustomerLeadRepository leadRepository;

    @Autowired
    private LeadChangeLogRepository changeLogRepository;

    @Autowired
    private SysUserRepository userRepository;

    @Override
    @Transactional
    public CustomerLead create(CustomerLead lead, Long operatorId) {
        CustomerLead saved = leadRepository.save(lead);
        logChange(saved, "CREATE", null, null, operatorId, "新建线索");
        return saved;
    }

    @Override
    @Transactional
    public CustomerLead update(CustomerLead lead, Long operatorId) {
        CustomerLead existing = leadRepository.findById(lead.getId())
                .orElseThrow(() -> new RuntimeException("线索不存在"));

        compareAndLog("customerName", existing.getCustomerName(), lead.getCustomerName(), existing, operatorId);
        compareAndLog("phone", existing.getPhone(), lead.getPhone(), existing, operatorId);
        compareAndLog("wechatId", existing.getWechatId(), lead.getWechatId(), existing, operatorId);
        compareAndLog("intendedVehicle", existing.getIntendedVehicle(), lead.getIntendedVehicle(), existing, operatorId);
        compareAndLog("requirements", existing.getRequirements(), lead.getRequirements(), existing, operatorId);
        compareAndLog("status", existing.getStatus() != null ? existing.getStatus().name() : null,
                lead.getStatus() != null ? lead.getStatus().name() : null, existing, operatorId);
        compareAndLog("source", existing.getSource() != null ? existing.getSource().name() : null,
                lead.getSource() != null ? lead.getSource().name() : null, existing, operatorId);
        compareAndLog("owner", existing.getOwner() != null ? existing.getOwner().getRealName() : null,
                lead.getOwner() != null ? lead.getOwner().getRealName() : null, existing, operatorId);
        compareAndLog("remark", existing.getRemark(), lead.getRemark(), existing, operatorId);

        existing.setCustomerName(lead.getCustomerName());
        existing.setPhone(lead.getPhone());
        existing.setWechatId(lead.getWechatId());
        existing.setIntendedVehicle(lead.getIntendedVehicle());
        existing.setRequirements(lead.getRequirements());
        existing.setStatus(lead.getStatus());
        existing.setSource(lead.getSource());
        existing.setOwner(lead.getOwner());
        existing.setRemark(lead.getRemark());

        return leadRepository.save(existing);
    }

    private void compareAndLog(String fieldName, String oldValue, String newValue, CustomerLead lead, Long operatorId) {
        if (oldValue == null && newValue == null) return;
        if (oldValue != null && oldValue.equals(newValue)) return;
        if (oldValue == null || !oldValue.equals(newValue)) {
            logChange(lead, fieldName, oldValue, newValue, operatorId, "修改字段");
        }
    }

    private void logChange(CustomerLead lead, String fieldName, String oldValue, String newValue, Long operatorId, String reason) {
        LeadChangeLog log = new LeadChangeLog();
        log.setLead(lead);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setChangeReason(reason);
        if (operatorId != null) {
            userRepository.findById(operatorId).ifPresent(log::setOperator);
        }
        changeLogRepository.save(log);
    }

    @Override
    public Optional<CustomerLead> findById(Long id) {
        return leadRepository.findById(id);
    }

    @Override
    public Optional<CustomerLead> findByIdWithOwner(Long id) {
        return leadRepository.findByIdWithOwner(id);
    }

    @Override
    public List<CustomerLead> findAll() {
        return leadRepository.findAll();
    }

    @Override
    public List<CustomerLead> findAllWithOwner() {
        return leadRepository.findAllWithOwner();
    }

    @Override
    public List<CustomerLead> search(LeadQueryDTO query) {
        Specification<CustomerLead> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(query.getCustomerName())) {
                predicates.add(cb.like(root.get("customerName"), "%" + query.getCustomerName() + "%"));
            }
            if (StringUtils.hasText(query.getPhone())) {
                predicates.add(cb.like(root.get("phone"), "%" + query.getPhone() + "%"));
            }
            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), query.getStatus()));
            }
            if (query.getSource() != null) {
                predicates.add(cb.equal(root.get("source"), query.getSource()));
            }
            if (query.getOwnerId() != null) {
                predicates.add(cb.equal(root.get("owner").get("id"), query.getOwnerId()));
            }
            if (query.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createTime"), query.getStartDate().atStartOfDay()));
            }
            if (query.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createTime"), query.getEndDate().atTime(23, 59, 59)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return leadRepository.findAll(spec);
    }

    @Override
    public List<LeadChangeLog> getChangeLogs(Long leadId) {
        return changeLogRepository.findByLeadIdOrderByCreateTimeDesc(leadId);
    }

    @Override
    @Transactional
    public void delete(Long id, Long operatorId) {
        CustomerLead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("线索不存在"));
        logChange(lead, "DELETE", lead.getCustomerName(), null, operatorId, "删除线索");
        leadRepository.delete(lead);
    }
}
