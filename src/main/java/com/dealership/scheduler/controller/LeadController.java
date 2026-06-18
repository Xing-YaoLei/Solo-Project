package com.dealership.scheduler.controller;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.LeadChangeLog;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.dto.LeadQueryDTO;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.CustomerLeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/leads")
public class LeadController {

    @Autowired
    private CustomerLeadService leadService;

    @Autowired
    private SysUserRepository userRepository;

    private static final Long DEFAULT_OPERATOR_ID = 1L;

    @GetMapping
    public String list(@ModelAttribute LeadQueryDTO query, Model model) {
        List<CustomerLead> leads;
        boolean hasQuery = query.getStatus() != null || query.getSource() != null ||
                (query.getKeyword() != null && !query.getKeyword().isEmpty()) ||
                query.getOwnerId() != null || query.getStartDate() != null || query.getEndDate() != null;
        if (hasQuery) {
            leads = leadService.search(query);
            for (CustomerLead lead : leads) {
                if (lead.getOwner() != null) {
                    lead.getOwner().getRealName();
                }
            }
        } else {
            leads = leadService.findAllWithOwner();
        }
        model.addAttribute("leads", leads);
        model.addAttribute("query", query);
        model.addAttribute("statuses", CustomerLead.LeadStatus.values());
        model.addAttribute("sources", CustomerLead.LeadSource.values());
        model.addAttribute("owners", userRepository.findByEnabledTrue());
        return "leads/list";
    }

    @GetMapping("/new")
    public String newLead(Model model) {
        model.addAttribute("lead", new CustomerLead());
        model.addAttribute("statuses", CustomerLead.LeadStatus.values());
        model.addAttribute("sources", CustomerLead.LeadSource.values());
        model.addAttribute("owners", userRepository.findByEnabledTrue());
        return "leads/form";
    }

    @PostMapping("/save")
    public String saveLead(@ModelAttribute CustomerLead lead,
                           @RequestParam(required = false) Long ownerId,
                           RedirectAttributes redirectAttrs) {
        try {
            if (ownerId != null) {
                userRepository.findById(ownerId).ifPresent(lead::setOwner);
            }
            if (lead.getId() == null) {
                leadService.create(lead, DEFAULT_OPERATOR_ID);
            } else {
                leadService.update(lead, DEFAULT_OPERATOR_ID);
            }
            redirectAttrs.addFlashAttribute("success", "线索保存成功");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "保存失败: " + e.getMessage());
        }
        return "redirect:/leads";
    }

    @GetMapping("/edit/{id}")
    public String editLead(@PathVariable Long id, Model model) {
        Optional<CustomerLead> leadOpt = leadService.findByIdWithOwner(id);
        if (leadOpt.isEmpty()) {
            return "redirect:/leads";
        }
        model.addAttribute("lead", leadOpt.get());
        model.addAttribute("statuses", CustomerLead.LeadStatus.values());
        model.addAttribute("sources", CustomerLead.LeadSource.values());
        model.addAttribute("owners", userRepository.findByEnabledTrue());
        return "leads/form";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Optional<CustomerLead> leadOpt = leadService.findByIdWithOwner(id);
        if (leadOpt.isEmpty()) {
            return "redirect:/leads";
        }
        model.addAttribute("lead", leadOpt.get());
        List<LeadChangeLog> changeLogs = leadService.getChangeLogs(id);
        model.addAttribute("changeLogs", changeLogs);
        return "leads/detail";
    }

    @GetMapping("/{id}/history")
    public String history(@PathVariable Long id, Model model) {
        Optional<CustomerLead> leadOpt = leadService.findByIdWithOwner(id);
        if (leadOpt.isEmpty()) {
            return "redirect:/leads";
        }
        model.addAttribute("lead", leadOpt.get());
        List<LeadChangeLog> changeLogs = leadService.getChangeLogs(id);
        model.addAttribute("changeLogs", changeLogs);
        return "leads/history";
    }

    @GetMapping("/delete/{id}")
    public String deleteLead(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        try {
            leadService.delete(id, DEFAULT_OPERATOR_ID);
            redirectAttrs.addFlashAttribute("success", "线索已删除");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "删除失败: " + e.getMessage());
        }
        return "redirect:/leads";
    }
}
