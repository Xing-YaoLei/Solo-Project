using HomeImprovementPlatform.API.Enums;
using Microsoft.AspNetCore.Identity;

namespace HomeImprovementPlatform.API.Models;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public virtual ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
    public virtual ICollection<Project> DesignerProjects { get; set; } = new List<Project>();
    public virtual ICollection<Project> ForemanProjects { get; set; } = new List<Project>();
    public virtual ICollection<Project> SupervisorProjects { get; set; } = new List<Project>();
    public virtual ICollection<ApprovalNode> ApprovalNodes { get; set; } = new List<ApprovalNode>();
    public virtual ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
    public virtual ICollection<DocumentHistory> DocumentHistories { get; set; } = new List<DocumentHistory>();
}
