package com.usedcar.acquisition.controller;

import com.usedcar.acquisition.common.Result;
import com.usedcar.acquisition.enums.ActionTypeEnum;
import com.usedcar.acquisition.enums.SourceTypeEnum;
import com.usedcar.acquisition.enums.TaskStatusEnum;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dict")
public class DictController {

    @GetMapping("/all")
    public Result<Map<String, Object>> getAllDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("taskStatus", getEnumList(TaskStatusEnum.values()));
        dict.put("sourceType", getEnumList(SourceTypeEnum.values()));
        dict.put("actionType", getEnumList(ActionTypeEnum.values()));
        dict.put("materialType", getMaterialTypeList());
        dict.put("vehicleStatus", getVehicleStatusList());
        dict.put("quoteType", getQuoteTypeList());
        dict.put("customerResponse", getCustomerResponseList());
        dict.put("closeType", getCloseTypeList());
        dict.put("userRole", getUserRoleList());
        return Result.success(dict);
    }

    @GetMapping("/task-status")
    public Result<List<Map<String, String>>> getTaskStatus() {
        return Result.success(getEnumList(TaskStatusEnum.values()));
    }

    @GetMapping("/source-type")
    public Result<List<Map<String, String>>> getSourceType() {
        return Result.success(getEnumList(SourceTypeEnum.values()));
    }

    private List<Map<String, String>> getEnumList(Object[] enums) {
        return Arrays.stream(enums).map(e -> {
            Map<String, String> m = new LinkedHashMap<>();
            try {
                m.put("code", (String) e.getClass().getMethod("getCode").invoke(e));
                m.put("desc", (String) e.getClass().getMethod("getDesc").invoke(e));
            } catch (Exception ignored) {}
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, String>> getMaterialTypeList() {
        String[][] arr = {
                {"ID_CARD_OWNER", "车主身份证"},
                {"ID_CARD_SPOUSE", "配偶身份证"},
                {"VEHICLE_REG_CERT", "车辆登记证(绿本)"},
                {"VEHICLE_LICENSE", "行驶证"},
                {"PURCHASE_INVOICE", "购车发票"},
                {"INSURANCE_POLICY", "保险单"},
                {"MAINTENANCE_RECORD", "保养记录"},
                {"VEHICLE_PHOTO", "车辆照片"},
                {"KEY_CERT", "车钥匙/备用钥匙"},
                {"LOAN_AGREEMENT", "贷款合同"},
                {"OTHER", "其他"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> getVehicleStatusList() {
        String[][] arr = {
                {"NORMAL", "正常"},
                {"ACCIDENT", "事故车"},
                {"WATER", "水泡车"},
                {"FIRE", "火烧车"},
                {"MODIFIED", "改装车"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> getQuoteTypeList() {
        String[][] arr = {
                {"INITIAL", "初评价"},
                {"COUNTER", "还价"},
                {"FINAL", "最终价"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> getCustomerResponseList() {
        String[][] arr = {
                {"ACCEPT", "接受"},
                {"REJECT", "拒绝"},
                {"COUNTER", "还价"},
                {"PENDING", "待考虑"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> getCloseTypeList() {
        String[][] arr = {
                {"NORMAL", "正常收购成功"},
                {"REJECT", "放弃收购"},
                {"CANCEL", "取消任务"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> getUserRoleList() {
        String[][] arr = {
                {"ADMIN", "管理员"},
                {"MANAGER", "经理"},
                {"ASSESSOR", "评估师"},
                {"SALES", "业务员"}
        };
        return buildList(arr);
    }

    private List<Map<String, String>> buildList(String[][] arr) {
        return Arrays.stream(arr).map(a -> {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("code", a[0]);
            m.put("desc", a[1]);
            return m;
        }).collect(Collectors.toList());
    }
}
