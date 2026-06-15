using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface ICourseService
{
    Task<IEnumerable<Course>> GetCoursesAsync(int? semesterId = null, int? departmentId = null, CourseStatus? status = null, string? search = null, CancellationToken cancellationToken = default);
    Task<Course?> GetCourseByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Course> CreateCourseAsync(Course course, CancellationToken cancellationToken = default);
    Task<Course> UpdateCourseAsync(Course course, CancellationToken cancellationToken = default);
    Task<bool> DeleteCourseAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> AssignTeacherAsync(int courseId, int teacherId, bool isMainTeacher = true, CancellationToken cancellationToken = default);
    Task<bool> RemoveTeacherAsync(int courseId, int teacherId, CancellationToken cancellationToken = default);
}
