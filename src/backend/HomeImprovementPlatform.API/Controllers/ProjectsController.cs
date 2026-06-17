using System.Security.Claims;
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

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var projects = await _projectService.GetAllAsync(userRole, userId);
        return Ok(projects);
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
