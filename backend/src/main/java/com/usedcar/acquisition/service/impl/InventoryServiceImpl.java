package com.usedcar.acquisition.service.impl;

import cn.hutool.core.util.StrUtil;
import com.usedcar.acquisition.mapper.InventoryMapper;
import com.usedcar.acquisition.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryMapper inventoryMapper;

    @Override
    public Map<String, Object> getTurnoverStats() {
        return inventoryMapper.getInventoryTurnoverStats();
    }

    @Override
    public List<Map<String, Object>> getInventoryList(String startDate, String endDate) {
        LocalDate start = StrUtil.isNotBlank(startDate) ?
                LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
        LocalDate end = StrUtil.isNotBlank(endDate) ?
                LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
        return inventoryMapper.getInventoryListWithVehicle(start, end);
    }
}
