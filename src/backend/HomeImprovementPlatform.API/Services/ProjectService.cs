using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Project;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
using HomeImprovementPlatform.API.Data;

namespace HomeImprovementPlatform.API.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllAsync(UserRole? userRole, Guid? userId);
    Task<ProjectDto> GetByIdAsync(Guid id);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, Guid createdById);
    Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectDto dto, Guid updatedById);
    Task DeleteAsync(Guid id);
}

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProjectService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProjectDto>> GetAllAsync(UserRole? userRole, Guid? userId)
    {
        var query = _context.Projects
            .Include(p => p.Owner)
            .Include(p => p.Designer)
            .Include(p => p.Foreman)
            .Include(p => p.Supervisor)
            .Include(p => p.Documents)
            .ThenInclude(d => d.ApprovalNodes)
            .Include(p => p.PaymentRecords)
            .AsQueryable();

        if (userRole.HasValue && userId.HasValue)
        {
            query = userRole.Value switch
            {
                UserRole.Owner => query.Where(p => p.OwnerId == userId.Value),
                UserRole.Designer => query.Where(p => p.DesignerId == userId.Value),
                UserRole.Foreman => query.Where(p => p.ForemanId == userId.Value),
                UserRole.Supervisor => query.Where(p => p.SupervisorId == userId.Value),
                _ => query
            };
        }

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<IEnumerable<ProjectDto>>(projects);
    }

    public async Task<ProjectDto> GetByIdAsync(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Owner)
            .Include(p => p.Designer)
            .Include(p => p.Foreman)
            .Include(p => p.Supervisor)
            .Include(p => p.Documents)
            .ThenInclude(d => d.Items)
            .Include(p => p.Documents)
            .ThenInclude(d => d.ApprovalNodes)
            .Include(p => p.Documents)
            .ThenInclude(d => d.Attachments)
            .Include(p => p.PaymentRecords)
            .Include(p => p.ScheduleTasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            throw new KeyNotFoundException($"Project with id {id} not found");

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, Guid createdById)
    {
        var project = _mapper.Map<Project>(dto);
        project.ProjectNumber = $"P-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        project.Status = DocumentStatus.Draft;
        project.CreatedAt = DateTime.UtcNow;

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(project.Id);
    }

    public async Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectDto dto, Guid updatedById)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            throw new KeyNotFoundException($"Project with id {id} not found");

        _mapper.Map(dto, project);
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            throw new KeyNotFoundException($"Project with id {id} not found");

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
    }
}
