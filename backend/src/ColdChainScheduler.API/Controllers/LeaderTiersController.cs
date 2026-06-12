using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderTiersController : ControllerBase
{
    private readonly IRepository<LeaderTier> _repository;

    public LeaderTiersController(IRepository<LeaderTier> repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaderTier>>> GetAll()
    {
        var tiers = await _repository.GetAllAsync();
        return Ok(tiers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LeaderTier>> GetById(int id)
    {
        var tier = await _repository.GetByIdAsync(id);
        if (tier == null) return NotFound(new { message = $"团长等级 {id} 不存在" });
        return Ok(tier);
    }

    [HttpPost]
    public async Task<ActionResult<LeaderTier>> Create(LeaderTier tier)
    {
        tier.CreatedAt = DateTime.UtcNow;
        await _repository.AddAsync(tier);
        await _repository.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = tier.Id }, tier);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, LeaderTier updated)
    {
        var tier = await _repository.GetByIdAsync(id);
        if (tier == null) return NotFound(new { message = $"团长等级 {id} 不存在" });

        tier.TierName = updated.TierName;
        tier.TierCode = updated.TierCode;
        tier.MinOrderAmount = updated.MinOrderAmount;
        tier.CommissionRate = updated.CommissionRate;
        tier.Description = updated.Description;
        tier.SortOrder = updated.SortOrder;
        tier.IsActive = updated.IsActive;

        await _repository.UpdateAsync(tier);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var tier = await _repository.GetByIdAsync(id);
        if (tier == null) return NotFound(new { message = $"团长等级 {id} 不存在" });

        await _repository.DeleteAsync(tier);
        await _repository.SaveChangesAsync();

        return NoContent();
    }
}
