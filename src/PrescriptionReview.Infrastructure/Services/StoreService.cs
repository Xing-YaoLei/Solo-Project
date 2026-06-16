using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class StoreService : IStoreService
{
    private readonly AppDbContext _context;

    public StoreService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<List<StoreDto>>> GetAllAsync()
    {
        var stores = await _context.Stores
            .Where(s => s.IsActive)
            .OrderBy(s => s.Code)
            .Select(s => new StoreDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                Address = s.Address,
                Phone = s.Phone,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return ApiResult<List<StoreDto>>.Ok(stores);
    }

    public async Task<ApiResult<PagedResult<StoreDto>>> GetPagedListAsync(StoreQueryDto query)
    {
        var queryable = _context.Stores.AsQueryable();

        if (query.IsActive.HasValue)
        {
            queryable = queryable.Where(s => s.IsActive == query.IsActive.Value);
        }

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            queryable = queryable.Where(s => s.Name.Contains(query.Keyword) || s.Code.Contains(query.Keyword));
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(s => s.Code)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(s => new StoreDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                Address = s.Address,
                Phone = s.Phone,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return ApiResult<PagedResult<StoreDto>>.Ok(new PagedResult<StoreDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<StoreDto>> GetByIdAsync(int id)
    {
        var store = await _context.Stores.FindAsync(id);
        if (store == null)
        {
            return ApiResult<StoreDto>.Fail("门店不存在");
        }

        return ApiResult<StoreDto>.Ok(new StoreDto
        {
            Id = store.Id,
            Name = store.Name,
            Code = store.Code,
            Address = store.Address,
            Phone = store.Phone,
            IsActive = store.IsActive,
            CreatedAt = store.CreatedAt
        });
    }
}
