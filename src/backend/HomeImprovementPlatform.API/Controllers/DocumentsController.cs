using System.Security.Claims;
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
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetAll(
        [FromQuery] DocumentType? type,
        [FromQuery] DocumentStatus? status,
        [FromQuery] AmountConsistencyStatus? consistency,
        [FromQuery] Guid? projectId)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var documents = await _documentService.GetAllAsync(type, status, consistency, projectId, userRole, userId);
        return Ok(documents);
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

    [HttpPost("{id}/approve/{approvalNodeId}")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<DocumentDto>> Approve(Guid id, Guid approvalNodeId, [FromBody] string comments)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.ApproveAsync(id, approvalNodeId, comments, userId);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reject/{approvalNodeId}")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<DocumentDto>> Reject(Guid id, Guid approvalNodeId, [FromBody] string comments)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.RejectAsync(id, approvalNodeId, comments, userId);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("batch-update")]
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
