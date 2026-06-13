using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Dtos;

public class DietRecordCreateDto
{
    public int UserId { get; set; }
    public DateTime RecordDate { get; set; }
    public MealType MealType { get; set; }
    public string FoodItems { get; set; } = string.Empty;
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public string? Notes { get; set; }
    public List<string>? PhotoUrls { get; set; }
}

public class DietRecordUpdateDto
{
    public MealType? MealType { get; set; }
    public string? FoodItems { get; set; }
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public string? Notes { get; set; }
    public List<string>? AddPhotoUrls { get; set; }
    public List<int>? RemovePhotoIds { get; set; }
}

public class CheckInPhotoDto
{
    public int Id { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class CoachCommentDto
{
    public int Id { get; set; }
    public int CoachId { get; set; }
    public string CoachName { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class DietRecordDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public MealType MealType { get; set; }
    public string FoodItems { get; set; } = string.Empty;
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public string? Notes { get; set; }
    public List<CheckInPhotoDto> Photos { get; set; } = new();
    public CoachCommentDto? CoachComment { get; set; }
}
