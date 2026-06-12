using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductTagsController : ControllerBase
{
    private readonly IRepository<ProductTag> _repository;
    private readonly IStatusChangeLogService _logService;

    public ProductTagsController(IRepository<ProductTag> repository, IStatusChangeLogService logService)
    {
        _repository = repository;
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductTag>>> GetAll()
    {
        var tags = await _repository.GetAllAsync();
        return Ok(tags);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductTag>> GetById(int id)
    {
        var tag = await _repository.GetByIdAsync(id);
        if (tag == null) return NotFound(new { message = $"商品标签 {id} 不存在" });
        return Ok(tag);
    }

    [HttpPost]
    public async Task<ActionResult<ProductTag>> Create(ProductTag tag)
    {
        tag.CreatedAt = DateTime.UtcNow;
        await _repository.AddAsync(tag);
        await _repository.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = tag.Id }, tag);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, ProductTag updated)
    {
        var tag = await _repository.GetByIdAsync(id);
        if (tag == null) return NotFound(new { message = $"商品标签 {id} 不存在" });

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

        await _repository.UpdateAsync(tag);
        await _repository.SaveChangesAsync();

        if (oldIsActive != updated.IsActive)
        {
            await _logService.LogStatusChange(
                "ProductTag", id,
                oldIsActive ? "Active" : "Inactive",
                updated.IsActive ? "Active" : "Inactive",
                null, "通过API更新");
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var tag = await _repository.GetByIdAsync(id);
        if (tag == null) return NotFound(new { message = $"商品标签 {id} 不存在" });

        await _repository.DeleteAsync(tag);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ProductTag", id, "Active", "Deleted", null, "通过API删除");

        return NoContent();
    }
}
