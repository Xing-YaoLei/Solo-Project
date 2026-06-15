using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Certificate> Certificates { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Chapter> Chapters { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<AssignmentRecord> AssignmentRecords { get; set; }
    public DbSet<QuestionTag> QuestionTags { get; set; }
    public DbSet<LearningProgress> LearningProgresses { get; set; }
    public DbSet<ProgressHistory> ProgressHistories { get; set; }
    public DbSet<ProgressAlert> ProgressAlerts { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ExportRecord> ExportRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Certificate>()
            .HasIndex(c => c.Code)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Course>()
            .HasOne(c => c.Certificate)
            .WithMany(c => c.Courses)
            .HasForeignKey(c => c.CertificateId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Chapter>()
            .HasOne(c => c.Course)
            .WithMany(c => c.Chapters)
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Chapter>()
            .HasOne(c => c.ParentChapter)
            .WithMany(c => c.ChildChapters)
            .HasForeignKey(c => c.ParentChapterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Course)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Chapter)
            .WithMany()
            .HasForeignKey(a => a.ChapterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AssignmentRecord>()
            .HasOne(ar => ar.Assignment)
            .WithMany(a => a.AssignmentRecords)
            .HasForeignKey(ar => ar.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AssignmentRecord>()
            .HasOne(ar => ar.User)
            .WithMany(u => u.AssignmentRecords)
            .HasForeignKey(ar => ar.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestionTag>()
            .HasOne(qt => qt.Chapter)
            .WithMany(c => c.QuestionTags)
            .HasForeignKey(qt => qt.ChapterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestionTag>()
            .HasOne(qt => qt.Assignment)
            .WithMany(a => a.QuestionTags)
            .HasForeignKey(qt => qt.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LearningProgress>()
            .HasOne(lp => lp.User)
            .WithMany(u => u.LearningProgresses)
            .HasForeignKey(lp => lp.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LearningProgress>()
            .HasOne(lp => lp.Certificate)
            .WithMany(c => c.LearningProgresses)
            .HasForeignKey(lp => lp.CertificateId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LearningProgress>()
            .HasOne(lp => lp.Course)
            .WithMany(c => c.LearningProgresses)
            .HasForeignKey(lp => lp.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressHistory>()
            .HasOne(ph => ph.LearningProgress)
            .WithMany(lp => lp.ProgressHistories)
            .HasForeignKey(ph => ph.LearningProgressId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProgressHistory>()
            .HasOne(ph => ph.ChangedBy)
            .WithMany()
            .HasForeignKey(ph => ph.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressAlert>()
            .HasOne(pa => pa.LearningProgress)
            .WithMany(lp => lp.ProgressAlerts)
            .HasForeignKey(pa => pa.LearningProgressId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProgressAlert>()
            .HasOne(pa => pa.User)
            .WithMany(u => u.ProgressAlerts)
            .HasForeignKey(pa => pa.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressAlert>()
            .HasOne(pa => pa.ResolvedBy)
            .WithMany()
            .HasForeignKey(pa => pa.ResolvedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExportRecord>()
            .HasOne(er => er.GeneratedBy)
            .WithMany(u => u.ExportRecords)
            .HasForeignKey(er => er.GeneratedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@example.com",
                FullName = "系统管理员",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 2,
                Username = "teacher1",
                Email = "teacher1@example.com",
                FullName = "张老师",
                Role = UserRole.Teacher,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 3,
                Username = "student1",
                Email = "student1@example.com",
                FullName = "李学员",
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<Certificate>().HasData(
            new Certificate
            {
                Id = 1,
                Name = "一级建造师",
                Code = "JZS-001",
                Description = "一级建造师职业资格考试",
                ExamDate = new DateTime(2025, 9, 15, 0, 0, 0, DateTimeKind.Utc),
                RegistrationStart = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                RegistrationEnd = new DateTime(2025, 7, 15, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Certificate
            {
                Id = 2,
                Name = "注册会计师",
                Code = "CPA-001",
                Description = "注册会计师全国统一考试",
                ExamDate = new DateTime(2025, 8, 23, 0, 0, 0, DateTimeKind.Utc),
                RegistrationStart = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                RegistrationEnd = new DateTime(2025, 4, 30, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<Course>().HasData(
            new Course
            {
                Id = 1,
                Name = "建设工程经济",
                CertificateId = 1,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Course
            {
                Id = 2,
                Name = "建设工程项目管理",
                CertificateId = 1,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Course
            {
                Id = 3,
                Name = "建设工程法规及相关知识",
                CertificateId = 1,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Course
            {
                Id = 4,
                Name = "会计",
                CertificateId = 2,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<Chapter>().HasData(
            new Chapter
            {
                Id = 1,
                Title = "第一章 资金时间价值",
                CourseId = 1,
                SortOrder = 1,
                EstimatedHours = 8,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Chapter
            {
                Id = 2,
                Title = "第二章 工程经济评价",
                CourseId = 1,
                SortOrder = 2,
                EstimatedHours = 12,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Chapter
            {
                Id = 3,
                Title = "第三章 投资方案经济效果评价",
                CourseId = 1,
                SortOrder = 3,
                EstimatedHours = 10,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Chapter
            {
                Id = 4,
                Title = "第一章 项目组织与管理",
                CourseId = 2,
                SortOrder = 1,
                EstimatedHours = 6,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<Assignment>().HasData(
            new Assignment
            {
                Id = 1,
                Title = "第一章课后练习",
                CourseId = 1,
                ChapterId = 1,
                Type = AssignmentType.Homework,
                TotalQuestions = 20,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Assignment
            {
                Id = 2,
                Title = "第二章课后练习",
                CourseId = 1,
                ChapterId = 2,
                Type = AssignmentType.Homework,
                TotalQuestions = 25,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Assignment
            {
                Id = 3,
                Title = "建设工程经济 模拟卷一",
                CourseId = 1,
                Type = AssignmentType.MockExam,
                DueDate = new DateTime(2025, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                TotalQuestions = 80,
                SortOrder = 10,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<QuestionTag>().HasData(
            new QuestionTag
            {
                Id = 1,
                Name = "资金等值计算",
                ChapterId = 1,
                AssignmentId = 1,
                QuestionCount = 5,
                Difficulty = TagDifficulty.Medium,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new QuestionTag
            {
                Id = 2,
                Name = "名义利率与有效利率",
                ChapterId = 1,
                AssignmentId = 1,
                QuestionCount = 3,
                Difficulty = TagDifficulty.Hard,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new QuestionTag
            {
                Id = 3,
                Name = "净现值计算",
                ChapterId = 2,
                AssignmentId = 2,
                QuestionCount = 6,
                Difficulty = TagDifficulty.Medium,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<LearningProgress>().HasData(
            new LearningProgress
            {
                Id = 1,
                UserId = 3,
                CertificateId = 1,
                CourseId = 1,
                CompletionRate = 35.5m,
                TargetRate = 60m,
                StartDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                TargetDate = new DateTime(2025, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                Status = ProgressStatus.Behind,
                Note = "学习进度落后，需要加快节奏",
                CreatedAt = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 5, 20, 0, 0, 0, DateTimeKind.Utc)
            },
            new LearningProgress
            {
                Id = 2,
                UserId = 3,
                CertificateId = 1,
                CourseId = 2,
                CompletionRate = 72m,
                TargetRate = 65m,
                StartDate = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                TargetDate = new DateTime(2025, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                Status = ProgressStatus.OnTrack,
                Note = "进度良好",
                CreatedAt = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 5, 15, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<ProgressHistory>().HasData(
            new ProgressHistory
            {
                Id = 1,
                LearningProgressId = 1,
                OldCompletionRate = 0m,
                NewCompletionRate = 20m,
                OldStatus = ProgressStatus.NotStarted,
                NewStatus = ProgressStatus.InProgress,
                ChangedByUserId = 3,
                ChangeReason = "开始学习第一章",
                ChangedAt = new DateTime(2025, 3, 10, 0, 0, 0, DateTimeKind.Utc)
            },
            new ProgressHistory
            {
                Id = 2,
                LearningProgressId = 1,
                OldCompletionRate = 20m,
                NewCompletionRate = 35.5m,
                OldStatus = ProgressStatus.InProgress,
                NewStatus = ProgressStatus.Behind,
                OldNote = null,
                NewNote = "学习进度落后，需要加快节奏",
                ChangedByUserId = 2,
                ChangeReason = "老师评估后调整状态",
                ChangedAt = new DateTime(2025, 5, 20, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<ProgressAlert>().HasData(
            new ProgressAlert
            {
                Id = 1,
                LearningProgressId = 1,
                UserId = 3,
                AlertType = AlertType.ProgressBehind,
                Severity = AlertSeverity.Medium,
                CurrentRate = 35.5m,
                ExpectedRate = 50m,
                BehindRate = 14.5m,
                Message = "建设工程经济课程进度落后14.5%",
                Status = AlertStatus.Open,
                CreatedAt = new DateTime(2025, 5, 20, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<AssignmentRecord>().HasData(
            new AssignmentRecord
            {
                Id = 1,
                AssignmentId = 1,
                UserId = 3,
                CorrectCount = 15,
                TotalQuestions = 20,
                Score = 75m,
                StartedAt = new DateTime(2025, 3, 20, 10, 0, 0, DateTimeKind.Utc),
                SubmittedAt = new DateTime(2025, 3, 20, 11, 30, 0, DateTimeKind.Utc),
                Status = RecordStatus.Submitted,
                CreatedAt = new DateTime(2025, 3, 20, 10, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 3, 20, 11, 30, 0, DateTimeKind.Utc)
            },
            new AssignmentRecord
            {
                Id = 2,
                AssignmentId = 2,
                UserId = 3,
                CorrectCount = 0,
                TotalQuestions = 25,
                Score = 0m,
                Status = RecordStatus.NotStarted,
                CreatedAt = new DateTime(2025, 3, 25, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
