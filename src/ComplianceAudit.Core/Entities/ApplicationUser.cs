using Microsoft.AspNetCore.Identity;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class ApplicationUser : IdentityUser<long>
{
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Department { get; set; }
    public AuditRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public virtual ICollection<AuditSchedule> AssignedSchedules { get; set; } = new List<AuditSchedule>();
    public virtual ICollection<CheckRecord> CreatedCheckRecords { get; set; } = new List<CheckRecord>();
    public virtual ICollection<Rectification> AssignedRectifications { get; set; } = new List<Rectification>();
}
