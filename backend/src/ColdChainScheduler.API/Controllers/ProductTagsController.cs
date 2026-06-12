using ColdChainScheduler.API.Dtos;
using ColdChainScheduler.Domain.Common;
using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/product-tags")]
public class ProductTagsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStatusChangeLogService _logService;

    public ProductTagsController(AppDbContext context, IStatusChangeLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    private static ProductTagDto MapToDto(ProductTag tag)
    {
        return new ProductTagDto
        {
            Id = tag.Id,
            TagCode = tag.TagCode,
            ProductName = tag.ProductName,
            Category = tag.Category,
            StorageTempMin = tag.StorageTempMin,
            StorageTempMax = tag.StorageTempMax,
            ShelfLifeHours = tag.ShelfLifeHours,
            Unit = tag.Unit,
            UnitPrice = tag.UnitPrice,
            Description = tag.Description,
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProductTagDto>>>> GetAll()
    {
        var tags = await _context.ProductTags.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var dtos = tags.Select(MapToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductTagDto>>> GetById(int id)
    {
        var tag = await _context.ProductTags.FindAsync(id);
        if (tag == null) return Ok(ApiResponse.Fail<ProductTagDto>($"商品标签 {id} 不存在"));
        return Ok(ApiResponse.Ok(MapToDto(tag)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductTagDto>>> Create(ProductTag tag)
    {
        tag.CreatedAt = DateTime.UtcNow;
        _context.ProductTags.Add(tag);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse.Ok(MapToDto(tag), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, ProductTag updated)
    {
        var tag = await _context.ProductTags.FindAsync(id);
        if (tag == null) return Ok(ApiResponse.Fail($"商品标签 {id} 不存在"));

        var oldIsActive = tag.IsActive;

        tag.TagCode = updated.TagCode;
        tag.ProductName = updated.ProductName;
        tag.Category = updated.Category;
        tag.StorageTempMin = updated.StorageTempMin;
        tag.StorageTempMax = updated.StorageTempMax;
        tag.ShelfLifeHours = updated.ShelfLifeHours;
        tag.Unit = updated.Unit;
        tag.UnitPrice = updated.UnitPrice;
        tag.Description = updated.Description;
        tag.IsActive = updated.IsActive;

        await _context.SaveChangesAsync();

        if (oldIsActive != updated.IsActive)
        {
            await _logService.LogStatusChange(
                "ProductTag", id,
                oldIsActive ? "Active" : "Inactive",
                updated.IsActive ? "Active" : "Inactive",
                null, "通过API更新");
        }

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var tag = await _context.ProductTags.FindAsync(id);
        if (tag == null) return Ok(ApiResponse.Fail($"商品标签 {id} 不存在"));

        _context.ProductTags.Remove(tag);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ProductTag", id, "Active", "Deleted", null, "通过API删除");

        return Ok(ApiResponse.Ok("删除成功"));
    }
}
