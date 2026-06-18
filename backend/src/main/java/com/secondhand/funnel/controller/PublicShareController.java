package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.ShareLink;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.repository.ListingFunnelRepository;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.DataAnomalyRepository;
import com.secondhand.funnel.enums.AnomalyType;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicShareController {

    private final ShareLinkService shareLinkService;
    private final ListingFunnelRepository listingFunnelRepository;
    private final CarInventoryRepository carInventoryRepository;
    private final DataAnomalyRepository dataAnomalyRepository;

    private static final String[] STAGE_NAMES = {"评估", "报价", "资料收集", "金融审批", "上架成功"};
    private static final FunnelStage[] STAGES = FunnelStage.values();

    @GetMapping("/share/{token}")
    public Result<Map<String, Object>> getShareData(
            @PathVariable String token,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {

        ShareLink link = shareLinkService.getByToken(token);
        String scope = link.getRoleScope();
        boolean includeSensitive = Boolean.TRUE.equals(link.getIncludeSensitive());
        UserRole accessRole = roleHeader != null ? parseRole(roleHeader) :
                (includeSensitive ? UserRole.STORE_MANAGER : UserRole.EXTERNAL);
        shareLinkService.validateAndAccess(token, accessRole);

        boolean isExternal = accessRole == UserRole.EXTERNAL;

        Map<String, Object> data = new HashMap<>();
        data.put("isExternal", isExternal);
        data.put("shareValid", true);

        List<Map<String, Object>> stagesList = new ArrayList<>();
        int[] counts = {50, 44, 37, 31, 26};
        for (int i = 0; i < STAGES.length; i++) {
            Map<String, Object> s = new HashMap<>();
            s.put("name", STAGE_NAMES[i]);
            s.put("count", counts[i]);
            double conv = i == 0 ? 100.0 : (counts[i] * 100.0 / counts[i - 1]);
            s.put("conversionRate", String.format("%.1f", conv));
            s.put("avgDays", i == 0 ? 1 : i == 1 ? 2 : i == 2 ? 5 : i == 3 ? 3 : 2);
            stagesList.add(s);
        }
        data.put("stages", stagesList);

        List<Map<String, Object>> anomalies = new ArrayList<>();
        long lib = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.LIBRARY_DELAY, false);
        if (lib > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "LIBRARY_DELAY");
            a.put("count", lib);
            a.put("details", "有 " + lib + " 辆车存在源库数据延迟");
            a.put("stageRange", Arrays.asList(0, 1, 2));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("label", "车源库延迟");
            cfg.put("color", "#e6a23c");
            a.put("config", cfg);
            anomalies.add(a);
        }
        long det = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.DETECTOR_MISSING, false);
        if (det > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "DETECTOR_MISSING");
            a.put("count", det);
            a.put("details", "有 " + det + " 辆车存在检测仪缺失");
            a.put("stageRange", Arrays.asList(1, 2, 3));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("label", "检测仪缺失");
            cfg.put("color", "#f56c6c");
            a.put("config", cfg);
            anomalies.add(a);
        }
        long cal = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.FINANCE_CALIBER_CHANGE, false);
        if (cal > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "FINANCE_CALIBER_CHANGE");
            a.put("count", cal);
            a.put("details", "金融审批口径已更新，涉及 " + cal + " 辆车");
            a.put("stageRange", Collections.singletonList(3));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("label", "金融口径变化");
            cfg.put("color", "#909399");
            a.put("config", cfg);
            anomalies.add(a);
        }
        data.put("anomalies", anomalies);

        if (!isExternal) {
            long total = carInventoryRepository.count();
            long listed = carInventoryRepository.countByStatus(com.secondhand.funnel.enums.CarStatus.LISTED);
            long sold = carInventoryRepository.countByStatus(com.secondhand.funnel.enums.CarStatus.SOLD);
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalCars", total);
            summary.put("listedCars", listed);
            summary.put("soldCars", sold);
            summary.put("overallConversion", total > 0 ? String.format("%.2f", listed * 100.0 / total) : "0");
            data.put("summary", summary);
        } else {
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalCars", "--");
            summary.put("listedCars", "--");
            summary.put("soldCars", "--");
            summary.put("overallConversion", "--");
            data.put("summary", summary);
            data.put("notice", "外部访问：敏感数据（价格、客户信息等）已隐藏");
        }

        return Result.success(data);
    }

    private UserRole parseRole(String role) {
        try {
            switch (role.toLowerCase()) {
                case "manager": return UserRole.STORE_MANAGER;
                case "assessor": return UserRole.ASSESSOR;
                case "sales": return UserRole.SALES;
                case "finance": return UserRole.FINANCE_STAFF;
                case "external": return UserRole.EXTERNAL;
                default: return UserRole.EXTERNAL;
            }
        } catch (Exception e) {
            return UserRole.EXTERNAL;
        }
    }
}
