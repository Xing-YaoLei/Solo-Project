using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Models;

namespace EduSchedule.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Semester> Semesters { get; set; }
    public DbSet<TimeSlot> TimeSlots { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<TeacherCourse> TeacherCourses { get; set; }
    public DbSet<Classroom> Classrooms { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<CourseSchedule> CourseSchedules { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<Conflict> Conflicts { get; set; }
    public DbSet<ConflictCommunication> ConflictCommunications { get; set; }
    public DbSet<ConflictReview> ConflictReviews { get; set; }
    public DbSet<ApprovalRecord> ApprovalRecords { get; set; }
    public DbSet<Transcript> Transcripts { get; set; }
    public DbSet<TranscriptDetail> TranscriptDetails { get; set; }
    public DbSet<Application> Applications { get; set; }
    public DbSet<ApplicationAttachment> ApplicationAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Course>()
            .HasOne(c => c.PrerequisiteCourse)
            .WithMany(c => c.DependentCourses)
            .HasForeignKey(c => c.PrerequisiteCourseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CourseSchedule>()
            .HasMany(cs => cs.Conflicts)
            .WithOne(c => c.Schedule1)
            .HasForeignKey(c => c.Schedule1Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conflict>()
            .HasOne(c => c.Schedule2)
            .WithMany()
            .HasForeignKey(c => c.Schedule2Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conflict>()
            .HasOne(c => c.Teacher1)
            .WithMany()
            .HasForeignKey(c => c.Teacher1Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conflict>()
            .HasOne(c => c.Teacher2)
            .WithMany()
            .HasForeignKey(c => c.Teacher2Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conflict>()
            .HasOne(c => c.ResolvedByUser)
            .WithMany()
            .HasForeignKey(c => c.ResolvedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conflict>()
            .HasOne(c => c.AssignedToUser)
            .WithMany()
            .HasForeignKey(c => c.AssignedTo)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Application>()
            .HasOne(a => a.TargetCourse)
            .WithMany()
            .HasForeignKey(a => a.TargetCourseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Department>()
            .HasOne(d => d.Head)
            .WithMany()
            .HasForeignKey(d => d.HeadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.StudentNumber)
            .IsUnique();

        modelBuilder.Entity<Course>()
            .HasIndex(c => c.CourseCode)
            .IsUnique();

        modelBuilder.Entity<Classroom>()
            .HasIndex(c => c.RoomNumber)
            .IsUnique();

        modelBuilder.Entity<Semester>()
            .HasIndex(s => new { s.AcademicYear, s.Type })
            .IsUnique();

        modelBuilder.Entity<TeacherCourse>()
            .HasIndex(tc => new { tc.UserId, tc.CourseId })
            .IsUnique();

        modelBuilder.Entity<Enrollment>()
            .HasIndex(e => new { e.StudentId, e.CourseId, e.SemesterId })
            .IsUnique();

        modelBuilder.Entity<CourseSchedule>()
            .HasIndex(cs => new { cs.ClassroomId, cs.DayOfWeek, cs.TimeSlotId, cs.SemesterId });
    }
}
