using EduSchedule.API.Models;

namespace EduSchedule.API.Services;

public interface IStudentService
{
    Task<IEnumerable<Student>> GetStudentsAsync(int? departmentId = null, int? grade = null, string? major = null, string? search = null, CancellationToken cancellationToken = default);
    Task<Student?> GetStudentByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student?> GetStudentByNumberAsync(string studentNumber, CancellationToken cancellationToken = default);
    Task<Student> CreateStudentAsync(Student student, CancellationToken cancellationToken = default);
    Task<Student> UpdateStudentAsync(Student student, CancellationToken cancellationToken = default);
    Task<bool> DeleteStudentAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Enrollment>> GetStudentEnrollmentsAsync(int studentId, int? semesterId = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<Transcript>> GetStudentTranscriptsAsync(int studentId, int? semesterId = null, CancellationToken cancellationToken = default);
}
