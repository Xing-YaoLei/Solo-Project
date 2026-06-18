using System.ComponentModel.DataAnnotations;

namespace CarServiceAppointment.API.Models;

public class Parts
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string PartNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Specification { get; set; }

    public int StockQuantity { get; set; }

    public int SafetyStock { get; set; }

    public decimal UnitPrice { get; set; }

    [MaxLength(100)]
    public string? Supplier { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<PartsShortageRecord> PartsShortageRecords { get; set; } = new List<PartsShortageRecord>();
}
