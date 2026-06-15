using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;

namespace EduSchedule.API.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _context;

    public StudentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Student>> GetStudentsAsync(int? departmentId = null, int? grade = null, string? major = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        if (grade.HasValue && grade.Value > 0)
            query = query.Where(s => s.Grade == grade.Value);
        if (!string.IsNullOrWhiteSpace(major))
            query = query.Where(s => s.Major != null && s.Major.Contains(major));
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.StudentNumber.Contains(search)
                || s.User.RealName.Contains(search)
                || s.ClassName != null && s.ClassName.Contains(search));

        return await query
            .OrderBy(s => s.StudentNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<Student?> GetStudentByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.Course)
            .Include(s => s.Transcripts)
                .ThenInclude(t => t.Course)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Student?> GetStudentByNumberAsync(string studentNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.StudentNumber == studentNumber, cancellationToken);
    }

    public async Task<Student> CreateStudentAsync(Student student, CancellationToken cancellationToken = default)
    {
        student.CreatedAt = DateTime.UtcNow;
        student.IsActive = true;

        _context.Students.Add(student);
        await _context.SaveChangesAsync(cancellationToken);

        return student;
    }

    public async Task<Student> UpdateStudentAsync(Student student, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Students.FindAsync(new object[] { student.Id }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Student with id {student.Id} not found");

        existing.StudentNumber = student.StudentNumber;
        existing.UserId = student.UserId;
        existing.DepartmentId = student.DepartmentId;
        existing.Major = student.Major;
        existing.ClassName = student.ClassName;
        existing.Grade = student.Grade;
        existing.GPA = student.GPA;
        existing.TotalCredits = student.TotalCredits;
        existing.EnrollmentDate = student.EnrollmentDate;
        existing.ExpectedGraduationDate = student.ExpectedGraduationDate;
        existing.Advisor = student.Advisor;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteStudentAsync(int id, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { id }, cancellationToken);
        if (student == null) return false;

        student.IsActive = false;
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<Enrollment>> GetStudentEnrollmentsAsync(int studentId, int? semesterId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Department)
            .Include(e => e.Course)
                .ThenInclude(c => c.TeacherCourses)
                    .ThenInclude(tc => tc.Teacher)
            .Include(e => e.Semester)
            .Where(e => e.StudentId == studentId);

        if (semesterId.HasValue)
            query = query.Where(e => e.SemesterId == semesterId.Value);

        return await query
            .OrderByDescending(e => e.Semester.AcademicYear)
            .ThenBy(e => e.Semester.Type)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Transcript>> GetStudentTranscriptsAsync(int studentId, int? semesterId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Transcripts
            .Include(t => t.Course)
            .Include(t => t.Semester)
            .Include(t => t.Details)
            .Where(t => t.StudentId == studentId && t.IsPublished);

        if (semesterId.HasValue)
            query = query.Where(t => t.SemesterId == semesterId.Value);

        return await query
            .OrderByDescending(t => t.Semester.AcademicYear)
            .ThenBy(t => t.Semester.Type)
            .ToListAsync(cancellationToken);
    }
}
