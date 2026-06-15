using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.DTOs;

public class AssignmentRecordDto
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public string? AssignmentTitle { get; set; }
    public AssignmentType AssignmentType { get; set; }
    public string? AssignmentTypeText { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int CorrectCount { get; set; }
    public int TotalQuestions { get; set; }
    public decimal Score { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public RecordStatus Status { get; set; }
    public string? StatusText { get; set; }
    public string? Remark { get; set; }
}

public class AssignmentRecordCreateDto
{
    public int AssignmentId { get; set; }
    public int UserId { get; set; }
}

public class AssignmentRecordUpdateDto
{
    public int CorrectCount { get; set; }
    public int TotalQuestions { get; set; }
    public RecordStatus Status { get; set; }
    public string? Remark { get; set; }
}
