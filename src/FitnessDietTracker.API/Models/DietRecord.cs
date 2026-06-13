using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Models;

public class DietRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime RecordDate { get; set; }
    public MealType MealType { get; set; }
    public string FoodItems { get; set; } = string.Empty;
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<CheckInPhoto> Photos { get; set; } = new List<CheckInPhoto>();
    public CoachComment? CoachComment { get; set; }
}
