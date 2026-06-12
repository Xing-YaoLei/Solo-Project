using ColdChainScheduler.API.Dtos;
using ColdChainScheduler.Domain.Common;
using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/leader-tiers")]
public class LeaderTiersController : ControllerBase
{
    private readonly AppDbContext _context;

    public LeaderTiersController(AppDbContext context)
    {
        _context = context;
    }

    private static LeaderTierDto MapToDto(LeaderTier tier)
    {
        return new LeaderTierDto
        {
            Id = tier.Id,
            TierName = tier.TierName,
            TierCode = tier.TierCode,
            MinOrderAmount = tier.MinOrderAmount,
            CommissionRate = tier.CommissionRate,
            Description = tier.Description,
            SortOrder = tier.SortOrder,
            IsActive = tier.IsActive,
            CreatedAt = tier.CreatedAt,
            UpdatedAt = tier.UpdatedAt
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<LeaderTierDto>>>> GetAll()
    {
        var tiers = await _context.LeaderTiers
            .OrderBy(t => t.SortOrder)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
        var dtos = tiers.Select(MapToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<LeaderTierDto>>> GetById(int id)
    {
        var tier = await _context.LeaderTiers.FindAsync(id);
        if (tier == null) return Ok(ApiResponse.Fail<LeaderTierDto>($"团长等级 {id} 不存在"));
        return Ok(ApiResponse.Ok(MapToDto(tier)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LeaderTierDto>>> Create(LeaderTier tier)
    {
        tier.CreatedAt = DateTime.UtcNow;
        _context.LeaderTiers.Add(tier);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse.Ok(MapToDto(tier), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, LeaderTier updated)
    {
        var tier = await _context.LeaderTiers.FindAsync(id);
        if (tier == null) return Ok(ApiResponse.Fail($"团长等级 {id} 不存在"));

        tier.TierName = updated.TierName;
        tier.TierCode = updated.TierCode;
        tier.MinOrderAmount = updated.MinOrderAmount;
        tier.CommissionRate = updated.CommissionRate;
        tier.Description = updated.Description;
        tier.SortOrder = updated.SortOrder;
        tier.IsActive = updated.IsActive;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var tier = await _context.LeaderTiers.FindAsync(id);
        if (tier == null) return Ok(ApiResponse.Fail($"团长等级 {id} 不存在"));

        _context.LeaderTiers.Remove(tier);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("删除成功"));
    }
}
