using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.DTOs.Project;

public class ProjectDto
{
    public Guid Id { get; set; }
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal? ActualAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public DocumentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public string OwnerName { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string? DesignerName { get; set; }
    public Guid? DesignerId { get; set; }
    public string? ForemanName { get; set; }
    public Guid? ForemanId { get; set; }
    public string? SupervisorName { get; set; }
    public Guid? SupervisorId { get; set; }
    
    public int DocumentCount { get; set; }
    public int PendingApprovals { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
}

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal TotalBudget { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? DesignerId { get; set; }
    public Guid? ForemanId { get; set; }
    public Guid? SupervisorId { get; set; }
}

public class UpdateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal TotalBudget { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public Guid? DesignerId { get; set; }
    public Guid? ForemanId { get; set; }
    public Guid? SupervisorId { get; set; }
    public DocumentStatus Status { get; set; }
}
