using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class Quote
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    public decimal LaborCost { get; set; }

    public decimal PartsCost { get; set; }

    public decimal TotalAmount { get; set; }

    public QuoteStatus Status { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<QuoteItem> QuoteItems { get; set; } = new List<QuoteItem>();
}
