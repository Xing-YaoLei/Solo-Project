using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class Project
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
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid OwnerId { get; set; }
    public virtual ApplicationUser? Owner { get; set; }
    public Guid? DesignerId { get; set; }
    public virtual ApplicationUser? Designer { get; set; }
    public Guid? ForemanId { get; set; }
    public virtual ApplicationUser? Foreman { get; set; }
    public Guid? SupervisorId { get; set; }
    public virtual ApplicationUser? Supervisor { get; set; }

    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
    public virtual ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
    public virtual ICollection<ScheduleTask> ScheduleTasks { get; set; } = new List<ScheduleTask>();
}
