package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.Store;
import com.secondhand.funnel.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping
    public Result<Store> create(@Valid @RequestBody Store store) {
        return Result.success(storeService.create(store));
    }

    @GetMapping("/{id}")
    public Result<Store> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") Boolean useCache) {
        Store store = Boolean.TRUE.equals(useCache)
                ? storeService.getByIdWithCache(id)
                : storeService.getById(id);
        return Result.success(store);
    }

    @GetMapping
    public Result<List<Store>> listAll(@RequestParam(defaultValue = "true") Boolean useCache) {
        List<Store> stores = Boolean.TRUE.equals(useCache)
                ? storeService.listAllWithCache()
                : storeService.listAll();
        return Result.success(stores);
    }

    @PutMapping("/{id}")
    public Result<Store> update(@PathVariable Long id, @Valid @RequestBody Store store) {
        return Result.success(storeService.update(id, store));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        storeService.delete(id);
        return Result.success();
    }

    @DeleteMapping("/cache")
    public Result<Void> evictCache() {
        storeService.evictCache();
        return Result.success();
    }
}
