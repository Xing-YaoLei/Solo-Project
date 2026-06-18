package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.FunnelStage;

import java.util.List;
import java.util.Optional;

public interface ListingFunnelService {
    ListingFunnel create(ListingFunnel funnel);
    ListingFunnel getById(Long id);
    List<ListingFunnel> getByCarId(Long carId);
    List<ListingFunnel> getByStage(FunnelStage stage);
    Optional<ListingFunnel> getByCarIdAndStage(Long carId, FunnelStage stage);
    List<ListingFunnel> listAll();
    ListingFunnel completeStage(Long id, String remark);
    ListingFunnel update(Long id, ListingFunnel funnel);
    void delete(Long id);
}
