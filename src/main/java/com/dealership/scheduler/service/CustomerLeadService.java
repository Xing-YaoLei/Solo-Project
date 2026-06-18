package com.dealership.scheduler.service;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.LeadChangeLog;
import com.dealership.scheduler.dto.LeadQueryDTO;

import java.util.List;
import java.util.Optional;

public interface CustomerLeadService {
    CustomerLead create(CustomerLead lead, Long operatorId);
    CustomerLead update(CustomerLead lead, Long operatorId);
    Optional<CustomerLead> findById(Long id);
    List<CustomerLead> findAll();
    List<CustomerLead> search(LeadQueryDTO query);
    List<LeadChangeLog> getChangeLogs(Long leadId);
    void delete(Long id, Long operatorId);
}
