package com.usedcar.acquisition.service;

import java.util.List;
import java.util.Map;

public interface InventoryService {
    Map<String, Object> getTurnoverStats();
    List<Map<String, Object>> getInventoryList(String startDate, String endDate);
}
