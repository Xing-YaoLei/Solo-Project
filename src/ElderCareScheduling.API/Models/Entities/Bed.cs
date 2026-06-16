using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;

namespace ElderCareScheduling.API.Models.Entities;

public class Bed
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string BedNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RoomNumber { get; set; }

    [MaxLength(100)]
    public string? Floor { get; set; }

    [MaxLength(100)]
    public string? Building { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public BedStatus Status { get; set; } = BedStatus.Available;

    [MaxLength(200)]
    public string? EquipmentInfo { get; set; }

    public virtual ICollection<CareSchedule> Schedules { get; set; } = new List<CareSchedule>();

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;
}
