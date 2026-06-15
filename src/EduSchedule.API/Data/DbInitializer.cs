using EduSchedule.API.Enums;
using EduSchedule.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace EduSchedule.API.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context, IServiceProvider serviceProvider)
    {
        if (!await context.Departments.AnyAsync())
        {
            await SeedDepartmentsAsync(context);
        }

        if (!await context.Users.AnyAsync())
        {
            await SeedUsersAsync(context);
        }

        if (!await context.Semesters.AnyAsync())
        {
            await SeedSemestersAsync(context);
        }

        if (!await context.TimeSlots.AnyAsync())
        {
            await SeedTimeSlotsAsync(context);
        }

        if (!await context.Classrooms.AnyAsync())
        {
            await SeedClassroomsAsync(context);
        }

        if (!await context.Courses.AnyAsync())
        {
            await SeedCoursesAsync(context);
        }

        if (!await context.Students.AnyAsync())
        {
            await SeedStudentsAsync(context);
        }

        if (!await context.CourseSchedules.AnyAsync())
        {
            await SeedSchedulesAsync(context);
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedDepartmentsAsync(AppDbContext context)
    {
        var departments = new List<Department>
        {
            new() { Name = "计算机科学与技术学院", Code = "CS", Description = "计算机科学与技术学院", IsActive = true },
            new() { Name = "数学与统计学院", Code = "MATH", Description = "数学与统计学院", IsActive = true },
            new() { Name = "外国语学院", Code = "FL", Description = "外国语学院", IsActive = true },
            new() { Name = "物理与电子工程学院", Code = "PHY", Description = "物理与电子工程学院", IsActive = true },
            new() { Name = "教务处", Code = "ACA", Description = "教务处", IsActive = true },
        };
        await context.Departments.AddRangeAsync(departments);
        await context.SaveChangesAsync();
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static async Task SeedUsersAsync(AppDbContext context)
    {
        var csDept = await context.Departments.FirstAsync(d => d.Code == "CS");
        var mathDept = await context.Departments.FirstAsync(d => d.Code == "MATH");
        var flDept = await context.Departments.FirstAsync(d => d.Code == "FL");
        var acaDept = await context.Departments.FirstAsync(d => d.Code == "ACA");

        var users = new List<User>
        {
            new()
            {
                UserName = "admin",
                RealName = "系统管理员",
                Email = "admin@edu.edu",
                PasswordHash = HashPassword("admin123"),
                Role = RoleType.Administrator,
                RoleName = "系统管理员",
                DepartmentId = acaDept.Id,
                DepartmentName = acaDept.Name,
                Title = "系统管理员",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "academic",
                RealName = "教务处主任",
                Email = "academic@edu.edu",
                PasswordHash = HashPassword("academic123"),
                Role = RoleType.AcademicAffairs,
                RoleName = "教务处",
                DepartmentId = acaDept.Id,
                DepartmentName = acaDept.Name,
                Title = "教务主任",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "dean",
                RealName = "张院长",
                Email = "dean@edu.edu",
                PasswordHash = HashPassword("dean123"),
                Role = RoleType.Dean,
                RoleName = "院长",
                DepartmentId = csDept.Id,
                DepartmentName = csDept.Name,
                Title = "教授",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "depthead",
                RealName = "李系主任",
                Email = "depthead@edu.edu",
                PasswordHash = HashPassword("depthead123"),
                Role = RoleType.DepartmentHead,
                RoleName = "系主任",
                DepartmentId = csDept.Id,
                DepartmentName = csDept.Name,
                Title = "副教授",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "teacher",
                RealName = "王老师",
                Email = "teacher@edu.edu",
                PasswordHash = HashPassword("teacher123"),
                Role = RoleType.Teacher,
                RoleName = "教师",
                DepartmentId = csDept.Id,
                DepartmentName = csDept.Name,
                Title = "讲师",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "teacher2",
                RealName = "刘老师",
                Email = "teacher2@edu.edu",
                PasswordHash = HashPassword("teacher123"),
                Role = RoleType.Teacher,
                RoleName = "教师",
                DepartmentId = mathDept.Id,
                DepartmentName = mathDept.Name,
                Title = "副教授",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "teacher3",
                RealName = "陈老师",
                Email = "teacher3@edu.edu",
                PasswordHash = HashPassword("teacher123"),
                Role = RoleType.Teacher,
                RoleName = "教师",
                DepartmentId = flDept.Id,
                DepartmentName = flDept.Name,
                Title = "讲师",
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                UserName = "student",
                RealName = "张小明",
                Email = "student@edu.edu",
                PasswordHash = HashPassword("student123"),
                Role = RoleType.Student,
                RoleName = "学生",
                DepartmentId = csDept.Id,
                DepartmentName = csDept.Name,
                IsActive = true,
                CreatedAt = DateTime.Now,
            },
        };
        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        csDept.HeadId = users.First(u => u.UserName == "depthead").Id;
        mathDept.HeadId = users.First(u => u.UserName == "teacher2").Id;
        flDept.HeadId = users.First(u => u.UserName == "teacher3").Id;
        await context.SaveChangesAsync();
    }

    private static async Task SeedSemestersAsync(AppDbContext context)
    {
        var currentYear = DateTime.Now.Year;
        var semesters = new List<Semester>
        {
            new()
            {
                AcademicYear = currentYear - 1,
                Type = SemesterType.Autumn,
                Name = $"{currentYear - 1}-{currentYear}学年第一学期",
                StartDate = new DateOnly(currentYear - 1, 9, 1),
                EndDate = new DateOnly(currentYear, 1, 15),
                CourseSelectionStartDate = new DateOnly(currentYear - 1, 6, 1),
                CourseSelectionEndDate = new DateOnly(currentYear - 1, 8, 31),
                ScheduleStartDate = new DateOnly(currentYear - 1, 7, 1),
                ScheduleEndDate = new DateOnly(currentYear - 1, 8, 31),
                IsCurrent = false,
                IsActive = true,
            },
            new()
            {
                AcademicYear = currentYear - 1,
                Type = SemesterType.Spring,
                Name = $"{currentYear - 1}-{currentYear}学年第二学期",
                StartDate = new DateOnly(currentYear, 2, 20),
                EndDate = new DateOnly(currentYear, 7, 10),
                CourseSelectionStartDate = new DateOnly(currentYear, 1, 1),
                CourseSelectionEndDate = new DateOnly(currentYear, 2, 15),
                ScheduleStartDate = new DateOnly(currentYear, 1, 10),
                ScheduleEndDate = new DateOnly(currentYear, 2, 10),
                IsCurrent = true,
                IsActive = true,
            },
        };
        await context.Semesters.AddRangeAsync(semesters);
        await context.SaveChangesAsync();
    }

    private static async Task SeedTimeSlotsAsync(AppDbContext context)
    {
        var timeSlots = new List<TimeSlot>
        {
            new() { Name = "第1-2节", PeriodNumber = 1, StartTime = "08:00", EndTime = "09:40", DisplayOrder = 1, IsActive = true },
            new() { Name = "第3-4节", PeriodNumber = 2, StartTime = "10:00", EndTime = "11:40", DisplayOrder = 2, IsActive = true },
            new() { Name = "第5-6节", PeriodNumber = 3, StartTime = "14:00", EndTime = "15:40", DisplayOrder = 3, IsActive = true },
            new() { Name = "第7-8节", PeriodNumber = 4, StartTime = "16:00", EndTime = "17:40", DisplayOrder = 4, IsActive = true },
            new() { Name = "第9-10节", PeriodNumber = 5, StartTime = "19:00", EndTime = "20:40", DisplayOrder = 5, IsActive = true },
        };
        await context.TimeSlots.AddRangeAsync(timeSlots);
        await context.SaveChangesAsync();
    }

    private static async Task SeedClassroomsAsync(AppDbContext context)
    {
        var classrooms = new List<Classroom>
        {
            new() { RoomNumber = "A101", Name = "A101 普通教室", Location = "教学楼A栋1楼", Type = RoomType.GeneralClassroom, Capacity = 60, Floor = "1楼", Building = "A栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = false, HasSoundSystem = false, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "A102", Name = "A102 普通教室", Location = "教学楼A栋1楼", Type = RoomType.GeneralClassroom, Capacity = 60, Floor = "1楼", Building = "A栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = false, HasSoundSystem = false, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "B201", Name = "B201 多媒体教室", Location = "教学楼B栋2楼", Type = RoomType.MultimediaClassroom, Capacity = 80, Floor = "2楼", Building = "B栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "C301", Name = "C301 计算机实验室", Location = "实验楼C栋3楼", Type = RoomType.ComputerLab, Capacity = 40, Equipment = "计算机40台,服务器2台", Floor = "3楼", Building = "C栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "D101", Name = "D101 物理实验室", Location = "实验楼D栋1楼", Type = RoomType.Laboratory, Capacity = 30, Equipment = "实验设备一批", Floor = "1楼", Building = "D栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = false, IsActive = true },
            new() { RoomNumber = "E101", Name = "E101 阶梯教室", Location = "教学楼E栋1楼", Type = RoomType.Auditorium, Capacity = 200, Floor = "1楼", Building = "E栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "A201", Name = "A201 会议室", Location = "教学楼A栋2楼", Type = RoomType.MeetingRoom, Capacity = 30, Floor = "2楼", Building = "A栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "A103", Name = "A103 普通教室", Location = "教学楼A栋1楼", Type = RoomType.GeneralClassroom, Capacity = 60, Floor = "1楼", Building = "A栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = false, HasSoundSystem = false, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "B202", Name = "B202 多媒体教室", Location = "教学楼B栋2楼", Type = RoomType.MultimediaClassroom, Capacity = 80, Floor = "2楼", Building = "B栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
            new() { RoomNumber = "C302", Name = "C302 计算机实验室", Location = "实验楼C栋3楼", Type = RoomType.ComputerLab, Capacity = 40, Equipment = "计算机40台", Floor = "3楼", Building = "C栋", HasProjector = true, HasWhiteboard = true, HasMicrophone = true, HasSoundSystem = true, HasAirConditioning = true, IsDisabledAccessible = true, IsActive = true },
        };
        await context.Classrooms.AddRangeAsync(classrooms);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCoursesAsync(AppDbContext context)
    {
        var csDept = await context.Departments.FirstAsync(d => d.Code == "CS");
        var mathDept = await context.Departments.FirstAsync(d => d.Code == "MATH");
        var flDept = await context.Departments.FirstAsync(d => d.Code == "FL");
        var currentSemester = await context.Semesters.FirstAsync(s => s.IsCurrent);
        var teacher1 = await context.Users.FirstAsync(u => u.UserName == "teacher");
        var teacher2 = await context.Users.FirstAsync(u => u.UserName == "teacher2");
        var teacher3 = await context.Users.FirstAsync(u => u.UserName == "teacher3");

        var courses = new List<Course>
        {
            new()
            {
                CourseCode = "CS101",
                Name = "计算机基础",
                Description = "介绍计算机科学的基础知识，包括计算机硬件、软件、操作系统等内容",
                Credits = 3,
                TotalHours = 48,
                WeeklyHours = 3,
                MaxStudents = 80,
                DepartmentId = csDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.MultimediaClassroom,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "CS201",
                Name = "数据结构与算法",
                Description = "学习常用数据结构和算法设计方法",
                Credits = 4,
                TotalHours = 64,
                WeeklyHours = 4,
                MaxStudents = 60,
                DepartmentId = csDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.MultimediaClassroom,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "CS301",
                Name = "数据库系统原理",
                Description = "关系数据库设计、SQL语言、数据库管理系统原理",
                Credits = 3,
                TotalHours = 48,
                WeeklyHours = 3,
                MaxStudents = 50,
                DepartmentId = csDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.ComputerLab,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "MA101",
                Name = "高等数学",
                Description = "微积分、线性代数、概率论基础",
                Credits = 4,
                TotalHours = 64,
                WeeklyHours = 4,
                MaxStudents = 120,
                DepartmentId = mathDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.Auditorium,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "EN101",
                Name = "大学英语",
                Description = "英语听说读写综合能力培养",
                Credits = 3,
                TotalHours = 48,
                WeeklyHours = 3,
                MaxStudents = 40,
                DepartmentId = flDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.MultimediaClassroom,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "CS401",
                Name = "软件工程",
                Description = "软件开发流程、需求分析、设计模式、测试方法",
                Credits = 3,
                TotalHours = 48,
                WeeklyHours = 3,
                MaxStudents = 40,
                DepartmentId = csDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.MultimediaClassroom,
                Status = CourseStatus.Draft,
                CreatedAt = DateTime.Now,
            },
            new()
            {
                CourseCode = "PH101",
                Name = "大学物理",
                Description = "力学、电磁学、光学基础",
                Credits = 4,
                TotalHours = 64,
                WeeklyHours = 4,
                MaxStudents = 100,
                DepartmentId = mathDept.Id,
                SemesterId = currentSemester.Id,
                RequiredRoomType = RoomType.Laboratory,
                Status = CourseStatus.Published,
                CreatedAt = DateTime.Now,
            },
        };
        await context.Courses.AddRangeAsync(courses);
        await context.SaveChangesAsync();

        var teacherAssignments = new List<TeacherCourse>
        {
            new() { UserId = teacher1.Id, CourseId = courses.First(c => c.CourseCode == "CS101").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher1.Id, CourseId = courses.First(c => c.CourseCode == "CS201").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher1.Id, CourseId = courses.First(c => c.CourseCode == "CS301").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher2.Id, CourseId = courses.First(c => c.CourseCode == "MA101").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher3.Id, CourseId = courses.First(c => c.CourseCode == "EN101").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher1.Id, CourseId = courses.First(c => c.CourseCode == "CS401").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
            new() { UserId = teacher2.Id, CourseId = courses.First(c => c.CourseCode == "PH101").Id, IsMainTeacher = true, TeachingRole = "主讲", CreatedAt = DateTime.Now },
        };
        await context.TeacherCourses.AddRangeAsync(teacherAssignments);
        await context.SaveChangesAsync();
    }

    private static async Task SeedStudentsAsync(AppDbContext context)
    {
        var csDept = await context.Departments.FirstAsync(d => d.Code == "CS");
        var user = await context.Users.FirstAsync(u => u.UserName == "student");

        var students = new List<Student>
        {
            new() { StudentNumber = "2024001", UserId = user.Id, DepartmentId = csDept.Id, Major = "计算机科学与技术", ClassName = "计科2024-1班", Grade = 2024, Gpa = 3.5, TotalCredits = 0, EnrollmentDate = new DateOnly(DateTime.Now.Year, 9, 1), ExpectedGraduationDate = new DateOnly(DateTime.Now.Year + 4, 6, 30), IsActive = true, CreatedAt = DateTime.Now },
            new() { StudentNumber = "2024002", UserId = user.Id, DepartmentId = csDept.Id, Major = "计算机科学与技术", ClassName = "计科2024-1班", Grade = 2024, Gpa = 3.2, TotalCredits = 0, EnrollmentDate = new DateOnly(DateTime.Now.Year, 9, 1), ExpectedGraduationDate = new DateOnly(DateTime.Now.Year + 4, 6, 30), IsActive = true, CreatedAt = DateTime.Now },
            new() { StudentNumber = "2024003", UserId = user.Id, DepartmentId = csDept.Id, Major = "计算机科学与技术", ClassName = "计科2024-1班", Grade = 2024, Gpa = 3.8, TotalCredits = 0, EnrollmentDate = new DateOnly(DateTime.Now.Year, 9, 1), ExpectedGraduationDate = new DateOnly(DateTime.Now.Year + 4, 6, 30), IsActive = true, CreatedAt = DateTime.Now },
            new() { StudentNumber = "2024004", UserId = user.Id, DepartmentId = csDept.Id, Major = "软件工程", ClassName = "软工2024-1班", Grade = 2024, Gpa = 3.0, TotalCredits = 0, EnrollmentDate = new DateOnly(DateTime.Now.Year, 9, 1), ExpectedGraduationDate = new DateOnly(DateTime.Now.Year + 4, 6, 30), IsActive = true, CreatedAt = DateTime.Now },
            new() { StudentNumber = "2024005", UserId = user.Id, DepartmentId = csDept.Id, Major = "软件工程", ClassName = "软工2024-1班", Grade = 2024, Gpa = 2.8, TotalCredits = 0, EnrollmentDate = new DateOnly(DateTime.Now.Year, 9, 1), ExpectedGraduationDate = new DateOnly(DateTime.Now.Year + 4, 6, 30), IsActive = true, CreatedAt = DateTime.Now },
        };
        await context.Students.AddRangeAsync(students);
        await context.SaveChangesAsync();
    }

    private static async Task SeedSchedulesAsync(AppDbContext context)
    {
        var currentSemester = await context.Semesters.FirstAsync(s => s.IsCurrent);
        var courses = await context.Courses.Include(c => c.TeacherCourses).ToListAsync();
        var classrooms = await context.Classrooms.ToListAsync();
        var timeSlots = await context.TimeSlots.ToListAsync();
        var deptHead = await context.Users.FirstAsync(u => u.UserName == "depthead");
        var academic = await context.Users.FirstAsync(u => u.UserName == "academic");

        var schedules = new List<CourseSchedule>
        {
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "B201").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 1).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Monday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "B201").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 3).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Wednesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS201").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "B202").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 2).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Tuesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS201").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "B202").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 4).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Thursday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS301").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "C301").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 3).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Monday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Pending,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "MA101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "E101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 1).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Tuesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "MA101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "E101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 2).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Thursday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "EN101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "A101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 3).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Tuesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "EN101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "A101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 4).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Friday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Approved,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "PH101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "D101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 5).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Monday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Draft,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "PH101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "D101").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 1).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Wednesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Draft,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
            new()
            {
                CourseId = courses.First(c => c.CourseCode == "CS101").Id,
                ClassroomId = classrooms.First(c => c.RoomNumber == "B201").Id,
                TimeSlotId = timeSlots.First(t => t.PeriodNumber == 1).Id,
                SemesterId = currentSemester.Id,
                DayOfWeek = Enums.WeekDay.Wednesday,
                StartWeek = 1,
                EndWeek = 16,
                ApprovalStatus = ApprovalStatus.Pending,
                CreatedAt = DateTime.Now,
                CreatedBy = academic.Id,
            },
        };
        await context.CourseSchedules.AddRangeAsync(schedules);
        await context.SaveChangesAsync();

        var approvalRecords = new List<ApprovalRecord>
        {
            new()
            {
                ScheduleId = schedules[0].Id,
                ApproverId = deptHead.Id,
                Status = ApprovalStatus.Approved,
                Comments = "排课合理，同意",
                ApprovalLevel = 1,
                RoleWhenApproved = nameof(RoleType.DepartmentHead),
                SubmittedAt = DateTime.Now.AddDays(-7),
                ApprovedAt = DateTime.Now.AddDays(-5),
                CreatedAt = DateTime.Now.AddDays(-5),
            },
            new()
            {
                ScheduleId = schedules[0].Id,
                ApproverId = academic.Id,
                Status = ApprovalStatus.Approved,
                Comments = "最终审核通过",
                ApprovalLevel = 2,
                RoleWhenApproved = nameof(RoleType.AcademicAffairs),
                SubmittedAt = DateTime.Now.AddDays(-5),
                ApprovedAt = DateTime.Now.AddDays(-3),
                CreatedAt = DateTime.Now.AddDays(-3),
            },
        };
        await context.ApprovalRecords.AddRangeAsync(approvalRecords);
        await context.SaveChangesAsync();
    }
}
