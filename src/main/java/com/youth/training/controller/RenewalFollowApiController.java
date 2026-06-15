package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.dto.RenewalFollowDTO;
import com.youth.training.entity.RenewalFollow;
import com.youth.training.repository.RenewalFollowRepository;
import com.youth.training.service.RenewalFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/renewal")
@RequiredArgsConstructor
public class RenewalFollowApiController {

    private final RenewalFollowService renewalFollowService;
    private final RenewalFollowRepository renewalFollowRepository;

    @GetMapping("/list")
    public Result<List<RenewalFollow>> list(@RequestParam(required = false) String followPerson,
                                             @RequestParam(required = false) String status) {
        List<RenewalFollow> list = renewalFollowRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        if (followPerson != null && !followPerson.isEmpty()) {
            list = list.stream()
                    .filter(f -> followPerson.equals(f.getFollowPerson()))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            list = list.stream()
                    .filter(f -> status.equals(f.getStatus()))
                    .collect(Collectors.toList());
        }
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<RenewalFollow> detail(@PathVariable Long id) {
        return Result.success(renewalFollowRepository.findById(id).orElse(null));
    }

    @PostMapping("/")
    public Result<RenewalFollow> create(@RequestBody RenewalFollowDTO dto) {
        return Result.success(renewalFollowService.createFollowRecord(dto));
    }

    @PutMapping("/{id}/status")
    public Result<RenewalFollow> updateStatus(@PathVariable Long id,
                                               @RequestParam String status,
                                               @RequestParam(required = false) String renewalStatus,
                                               @RequestParam(required = false) String reason,
                                               @RequestParam(required = false) String operator) {
        return Result.success(renewalFollowService.updateFollowStatus(id, status, renewalStatus, reason, operator));
    }

    @GetMapping("/upcoming")
    public Result<List<Map<String, Object>>> upcoming(@RequestParam(defaultValue = "30") Integer days) {
        return Result.success(renewalFollowService.getUpcomingRenewals(days));
    }

    @GetMapping("/today")
    public Result<List<RenewalFollow>> today(@RequestParam(required = false) String followPerson) {
        if (followPerson == null || followPerson.isEmpty()) {
            return Result.success(renewalFollowRepository.findAll(Sort.by(Sort.Direction.ASC, "planDate")));
        }
        return Result.success(renewalFollowService.getTodayFollowList(followPerson));
    }
}
