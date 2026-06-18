package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.DataAnomaly;
import com.secondhand.funnel.enums.AnomalyType;

import java.util.List;

public interface DataAnomalyService {
    DataAnomaly create(DataAnomaly anomaly);
    DataAnomaly getById(Long id);
    List<DataAnomaly> getByCarId(Long carId);
    List<DataAnomaly> getByAnomalyType(AnomalyType type);
    List<DataAnomaly> getUnresolved();
    List<DataAnomaly> listAll();
    DataAnomaly resolve(Long id, String description);
    DataAnomaly update(Long id, DataAnomaly anomaly);
    void delete(Long id);
    long countUnresolved();
}
