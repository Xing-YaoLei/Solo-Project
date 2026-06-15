using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _context;

    public CourseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Course>> GetCoursesAsync(int? semesterId = null, int? departmentId = null, CourseStatus? status = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Courses
            .Include(c => c.Department)
            .Include(c => c.Semester)
            .Include(c => c.TeacherCourses)
                .ThenInclude(tc => tc.Teacher)
            .Include(c => c.Enrollments)
            .AsQueryable();

        if (semesterId.HasValue)
            query = query.Where(c => c.SemesterId == semesterId.Value);
        if (departmentId.HasValue)
            query = query.Where(c => c.DepartmentId == departmentId.Value);
        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.CourseCode.Contains(search));

        return await query
            .OrderBy(c => c.CourseCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<Course?> GetCourseByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Courses
            .Include(c => c.Department)
            .Include(c => c.Semester)
            .Include(c => c.TeacherCourses)
                .ThenInclude(tc => tc.Teacher)
            .Include(c => c.Enrollments)
                .ThenInclude(e => e.Student)
                    .ThenInclude(s => s.User)
            .Include(c => c.Schedules)
                .ThenInclude(s => s.Classroom)
            .Include(c => c.Schedules)
                .ThenInclude(s => s.TimeSlot)
            .Include(c => c.PrerequisiteCourse)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Course> CreateCourseAsync(Course course, CancellationToken cancellationToken = default)
    {
        course.CreatedAt = DateTime.UtcNow;
        course.Status = CourseStatus.Draft;

        _context.Courses.Add(course);
        await _context.SaveChangesAsync(cancellationToken);

        return course;
    }

    public async Task<Course> UpdateCourseAsync(Course course, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Courses.FindAsync(new object[] { course.Id }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Course with id {course.Id} not found");

        existing.CourseCode = course.CourseCode;
        existing.Name = course.Name;
        existing.Description = course.Description;
        existing.Credits = course.Credits;
        existing.TotalHours = course.TotalHours;
        existing.WeeklyHours = course.WeeklyHours;
        existing.MaxStudents = course.MaxStudents;
        existing.DepartmentId = course.DepartmentId;
        existing.SemesterId = course.SemesterId;
        existing.RequiredRoomType = course.RequiredRoomType;
        existing.EquipmentRequirements = course.EquipmentRequirements;
        existing.PrerequisiteCourseId = course.PrerequisiteCourseId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteCourseAsync(int id, CancellationToken cancellationToken = default)
    {
        var course = await _context.Courses.FindAsync(new object[] { id }, cancellationToken);
        if (course == null) return false;

        var hasSchedules = await _context.CourseSchedules.AnyAsync(s => s.CourseId == id, cancellationToken);
        if (hasSchedules)
            throw new InvalidOperationException("该课程已有排课记录，无法删除");

        var hasEnrollments = await _context.Enrollments.AnyAsync(e => e.CourseId == id, cancellationToken);
        if (hasEnrollments)
            throw new InvalidOperationException("该课程已有学生选课，无法删除");

        _context.TeacherCourses.RemoveRange(_context.TeacherCourses.Where(tc => tc.CourseId == id));
        _context.Courses.Remove(course);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AssignTeacherAsync(int courseId, int teacherId, bool isMainTeacher = true, CancellationToken cancellationToken = default)
    {
        var course = await _context.Courses.FindAsync(new object[] { courseId }, cancellationToken);
        var teacher = await _context.Users.FindAsync(new object[] { teacherId }, cancellationToken);

        if (course == null || teacher == null)
            return false;

        if (teacher.Role != RoleType.Teacher && teacher.Role != RoleType.DepartmentHead && teacher.Role != RoleType.Dean)
            throw new InvalidOperationException("只有教师或管理角色才能被分配为授课教师");

        var existing = await _context.TeacherCourses
            .FirstOrDefaultAsync(tc => tc.CourseId == courseId && tc.UserId == teacherId, cancellationToken);

        if (existing != null)
        {
            existing.IsMainTeacher = isMainTeacher;
            existing.TeachingRole = isMainTeacher ? "主讲教师" : "辅助教师";
        }
        else
        {
            _context.TeacherCourses.Add(new TeacherCourse
            {
                CourseId = courseId,
                UserId = teacherId,
                IsMainTeacher = isMainTeacher,
                TeachingRole = isMainTeacher ? "主讲教师" : "辅助教师"
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveTeacherAsync(int courseId, int teacherId, CancellationToken cancellationToken = default)
    {
        var tc = await _context.TeacherCourses
            .FirstOrDefaultAsync(tc => tc.CourseId == courseId && tc.UserId == teacherId, cancellationToken);

        if (tc == null) return false;

        _context.TeacherCourses.Remove(tc);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
