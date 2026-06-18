package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.service.ListingFunnelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/listing-funnels")
@RequiredArgsConstructor
public class ListingFunnelController {

    private final ListingFunnelService listingFunnelService;

    @PostMapping
    public Result<ListingFunnel> create(@Valid @RequestBody ListingFunnel funnel) {
        return Result.success(listingFunnelService.create(funnel));
    }

    @GetMapping("/{id}")
    public Result<ListingFunnel> getById(@PathVariable Long id) {
        return Result.success(listingFunnelService.getById(id));
    }

    @GetMapping
    public Result<List<ListingFunnel>> listAll() {
        return Result.success(listingFunnelService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<ListingFunnel>> getByCarId(@PathVariable Long carId) {
        return Result.success(listingFunnelService.getByCarId(carId));
    }

    @GetMapping("/stage/{stage}")
    public Result<List<ListingFunnel>> getByStage(@PathVariable FunnelStage stage) {
        return Result.success(listingFunnelService.getByStage(stage));
    }

    @GetMapping("/car/{carId}/stage/{stage}")
    public Result<Optional<ListingFunnel>> getByCarIdAndStage(
            @PathVariable Long carId,
            @PathVariable FunnelStage stage) {
        return Result.success(listingFunnelService.getByCarIdAndStage(carId, stage));
    }

    @PatchMapping("/{id}/complete")
    public Result<ListingFunnel> completeStage(
            @PathVariable Long id,
            @RequestParam(required = false) String remark) {
        return Result.success(listingFunnelService.completeStage(id, remark));
    }

    @PutMapping("/{id}")
    public Result<ListingFunnel> update(@PathVariable Long id, @Valid @RequestBody ListingFunnel funnel) {
        return Result.success(listingFunnelService.update(id, funnel));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        listingFunnelService.delete(id);
        return Result.success();
    }
}
