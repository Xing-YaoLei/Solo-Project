using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Services;

public interface IFollowUpService
{
    Task<IEnumerable<FollowUpTaskDto>> GetFollowUpTasksAsync(
        FollowUpStatus? status = null,
        FollowUpType? type = null,
        int? patientId = null,
        int? appointmentId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20);

    Task<FollowUpTaskDto?> GetFollowUpTaskByIdAsync(int id);
    Task<FollowUpTaskDto> CreateFollowUpTaskAsync(CreateFollowUpTaskDto dto);
    Task<FollowUpTaskDto?> UpdateFollowUpTaskAsync(int id, UpdateFollowUpTaskDto dto);
    Task<bool> DeleteFollowUpTaskAsync(int id);
    Task<bool> CompleteFollowUpTaskAsync(int id, string result, string completedBy);
    Task<int> GetFollowUpTaskCountAsync(
        FollowUpStatus? status = null,
        FollowUpType? type = null,
        int? patientId = null,
        int? appointmentId = null);
}
