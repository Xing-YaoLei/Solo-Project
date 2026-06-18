using Microsoft.AspNetCore.Identity;

namespace AutoRepair.Domain.Entities;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Position { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<WorkOrder> AssignedWorkOrders { get; set; } = new List<WorkOrder>();
    public ICollection<Diagnosis> Diagnoses { get; set; } = new List<Diagnosis>();
    public ICollection<Quote> CreatedQuotes { get; set; } = new List<Quote>();
    public ICollection<ReviewOpinion> ReviewOpinions { get; set; } = new List<ReviewOpinion>();
    public ICollection<CommunicationLog> SentMessages { get; set; } = new List<CommunicationLog>();
    public ICollection<CommunicationLog> ReceivedMessages { get; set; } = new List<CommunicationLog>();
}
