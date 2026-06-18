using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class Appointment
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string AppointmentNo { get; set; } = string.Empty;

    [Required]
    public int VehicleId { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    public DateTime AppointmentTime { get; set; }

    public DateTime? CheckInTime { get; set; }

    public DateTime? CompletionTime { get; set; }

    public DateTime? CloseTime { get; set; }

    public AppointmentSource Source { get; set; }

    [MaxLength(50)]
    public string? PersonInCharge { get; set; }

    public AppointmentStatus Status { get; set; }

    [MaxLength(500)]
    public string? FaultDescription { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();

    public ICollection<InspectionPhoto> InspectionPhotos { get; set; } = new List<InspectionPhoto>();

    public ICollection<PartsShortageRecord> PartsShortageRecords { get; set; } = new List<PartsShortageRecord>();

    public ICollection<ServiceRecord> ServiceRecords { get; set; } = new List<ServiceRecord>();

    public ICollection<RepairReturn> OriginalRepairReturns { get; set; } = new List<RepairReturn>();

    public ICollection<RepairReturn> NewRepairReturns { get; set; } = new List<RepairReturn>();
}
