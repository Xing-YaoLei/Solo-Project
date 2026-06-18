using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class Vehicle
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string PlateNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string VinNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string OwnerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string OwnerPhone { get; set; } = string.Empty;

    public decimal Mileage { get; set; }

    public DateTime? LastMaintenanceDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
