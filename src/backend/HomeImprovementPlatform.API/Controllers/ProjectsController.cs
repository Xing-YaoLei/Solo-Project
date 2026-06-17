using System.Security.Claims;
using HomeImprovementPlatform.API.DTOs;
using HomeImprovementPlatform.API.DTOs.Document;
using HomeImprovementPlatform.API.DTOs.Payment;
using HomeImprovementPlatform.API.DTOs.Project;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IDocumentService _documentService;
    private readonly IPaymentService _paymentService;

    public ProjectsController(
        IProjectService projectService,
        IDocumentService documentService,
        IPaymentService paymentService)
    {
        _projectService = projectService;
        _documentService = documentService;
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ProjectDto>>> GetAll(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] DocumentStatus? status = null)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var allProjects = await _projectService.GetAllAsync(userRole, userId);

        var query = allProjects.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.ProjectNumber.ToLower().Contains(s) || p.Address.ToLower().Contains(s));
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var totalCount = query.Count();
        var items = query.OrderByDescending(p => p.CreatedAt)
                         .Skip((pageIndex - 1) * pageSize)
                         .Take(pageSize)
                         .ToList();

        return Ok(new PaginatedResponse<ProjectDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id)
    {
        try
        {
            var project = await _projectService.GetByIdAsync(id);
            return Ok(project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/documents")]
    public async Task<ActionResult<PaginatedResponse<DocumentDto>>> GetProjectDocuments(
        Guid id,
        [FromQuery] DocumentType? type,
        [FromQuery] DocumentStatus? status,
        [FromQuery] AmountConsistencyStatus? amountConsistency,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var allDocuments = await _documentService.GetAllAsync(type, status, amountConsistency, id, userRole, userId);

        var items = allDocuments.OrderByDescending(d => d.CreatedAt)
                                .Skip((pageIndex - 1) * pageSize)
                                .Take(pageSize)
                                .ToList();

        return Ok(new PaginatedResponse<DocumentDto>
        {
            Items = items,
            TotalCount = allDocuments.Count(),
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}/payments")]
    public async Task<ActionResult<PaginatedResponse<PaymentRecordDto>>> GetProjectPayments(
        Guid id,
        [FromQuery] PaymentStatus? status,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var allPayments = await _paymentService.GetAllAsync(status, id);

        var items = allPayments.OrderByDescending(p => p.CreatedAt)
                               .Skip((pageIndex - 1) * pageSize)
                               .Take(pageSize)
                               .ToList();

        return Ok(new PaginatedResponse<PaymentRecordDto>
        {
            Items = items,
            TotalCount = allPayments.Count(),
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpPost]
    [Authorize(Roles = "Designer,Supervisor")]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectDto dto)
    {
        var userId = GetCurrentUserId();
        var project = await _projectService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Designer,Supervisor")]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, [FromBody] UpdateProjectDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var project = await _projectService.UpdateAsync(id, dto, userId);
            return Ok(project);
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
            await _projectService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
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
