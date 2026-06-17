using System.Security.Claims;
using HomeImprovementPlatform.API.DTOs;
using HomeImprovementPlatform.API.DTOs.Auth;
using HomeImprovementPlatform.API.DTOs.Document;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DocumentDto>>> GetAll(
        [FromQuery] DocumentType? type,
        [FromQuery] DocumentStatus? status,
        [FromQuery] AmountConsistencyStatus? amountConsistency,
        [FromQuery] Guid? projectId,
        [FromQuery] string? search,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var allDocs = await _documentService.GetAllAsync(type, status, amountConsistency, projectId, userRole, userId);

        var query = allDocs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(d => d.Title.ToLower().Contains(s) || d.DocumentNumber.ToLower().Contains(s));
        }

        var totalCount = query.Count();
        var items = query.OrderByDescending(d => d.CreatedAt)
                         .Skip((pageIndex - 1) * pageSize)
                         .Take(pageSize)
                         .ToList();

        return Ok(new PaginatedResponse<DocumentDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDto>> GetById(Guid id)
    {
        try
        {
            var document = await _documentService.GetByIdAsync(id);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Designer,Foreman,Supervisor")]
    public async Task<ActionResult<DocumentDto>> Create([FromBody] CreateDocumentDto dto)
    {
        var userId = GetCurrentUserId();
        var document = await _documentService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, document);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Designer,Foreman,Supervisor")]
    public async Task<ActionResult<DocumentDto>> Update(Guid id, [FromBody] UpdateDocumentDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.UpdateAsync(id, dto, userId);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _documentService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Designer,Foreman,Supervisor")]
    public async Task<ActionResult<DocumentDto>> SubmitForApproval(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.SubmitForApprovalAsync(id, userId);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<DocumentDto>> Approve(Guid id, [FromBody] ApprovalRequestDto? request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comments = request?.Comments ?? string.Empty;
            var document = await _documentService.ApproveByUserAsync(id, userId, comments);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<DocumentDto>> Reject(Guid id, [FromBody] ApprovalRequestDto? request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comments = request?.Comments ?? string.Empty;
            var document = await _documentService.RejectByUserAsync(id, userId, comments);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Supervisor")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> BatchUpdate([FromBody] BatchUpdateDocumentsDto dto)
    {
        var userId = GetCurrentUserId();
        var documents = await _documentService.BatchUpdateStatusAsync(dto, userId);
        return Ok(documents);
    }

    [HttpGet("inconsistent")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetInconsistent()
    {
        var documents = await _documentService.GetInconsistentDocumentsAsync();
        return Ok(documents);
    }

    [HttpPost("{id}/verify-amount")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<DocumentDto>> VerifyAmount(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.VerifyAmountConsistencyAsync(id, userId);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<DocumentHistoryDto>>> GetHistory(Guid id)
    {
        var history = await _documentService.GetHistoryAsync(id);
        return Ok(history);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return Enum.TryParse<UserRole>(roleClaim, out var role) ? role : null;
    }
}
