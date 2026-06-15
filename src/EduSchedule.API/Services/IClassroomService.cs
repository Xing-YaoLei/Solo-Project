using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface IClassroomService
{
    Task<IEnumerable<Classroom>> GetClassroomsAsync(RoomType? type = null, int? minCapacity = null, string? search = null, CancellationToken cancellationToken = default);
    Task<Classroom?> GetClassroomByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Classroom> CreateClassroomAsync(Classroom classroom, CancellationToken cancellationToken = default);
    Task<Classroom> UpdateClassroomAsync(Classroom classroom, CancellationToken cancellationToken = default);
    Task<bool> DeleteClassroomAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Classroom>> GetAvailableClassroomsAsync(int semesterId, WeekDay dayOfWeek, int timeSlotId, int startWeek, int endWeek, RoomType? requiredType = null, int? minCapacity = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ClassroomUsageDto>> GetClassroomUsageReportAsync(int semesterId, CancellationToken cancellationToken = default);
}
