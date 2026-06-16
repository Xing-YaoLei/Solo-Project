using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<ElderlyProfile> ElderlyProfiles => Set<ElderlyProfile>();
    public DbSet<MedicationDictionary> MedicationDictionaries => Set<MedicationDictionary>();
    public DbSet<MedicationSchedule> MedicationSchedules => Set<MedicationSchedule>();
    public DbSet<MedicationReminderLog> MedicationReminderLogs => Set<MedicationReminderLog>();
    public DbSet<VisitRecordRule> VisitRecordRules => Set<VisitRecordRule>();
    public DbSet<VisitRecord> VisitRecords => Set<VisitRecord>();
    public DbSet<ActivityCheckInThreshold> ActivityCheckInThresholds => Set<ActivityCheckInThreshold>();
    public DbSet<ActivityCheckIn> ActivityCheckIns => Set<ActivityCheckIn>();
    public DbSet<RiskEvent> RiskEvents => Set<RiskEvent>();
    public DbSet<RiskEventReminder> RiskEventReminders => Set<RiskEventReminder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Staff>()
            .HasOne(s => s.Area)
            .WithMany(a => a.Staff)
            .HasForeignKey(s => s.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ElderlyProfile>()
            .HasOne(e => e.Area)
            .WithMany(a => a.ElderlyProfiles)
            .HasForeignKey(e => e.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ElderlyProfile>()
            .HasOne(e => e.PrimaryStaff)
            .WithMany(s => s.PrimaryElderlyProfiles)
            .HasForeignKey(e => e.PrimaryStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicationSchedule>()
            .HasOne(m => m.Elderly)
            .WithMany(e => e.MedicationSchedules)
            .HasForeignKey(m => m.ElderlyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MedicationSchedule>()
            .HasOne(m => m.MedicationDict)
            .WithMany(d => d.MedicationSchedules)
            .HasForeignKey(m => m.MedicationDictId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicationSchedule>()
            .HasOne(m => m.CreatedByStaff)
            .WithMany(s => s.CreatedMedicationSchedules)
            .HasForeignKey(m => m.CreatedByStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicationReminderLog>()
            .HasOne(r => r.Schedule)
            .WithMany(s => s.ReminderLogs)
            .HasForeignKey(r => r.ScheduleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MedicationReminderLog>()
            .HasOne(r => r.Elderly)
            .WithMany(e => e.MedicationReminderLogs)
            .HasForeignKey(r => r.ElderlyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MedicationReminderLog>()
            .HasOne(r => r.AcknowledgedByStaff)
            .WithMany(s => s.AcknowledgedReminderLogs)
            .HasForeignKey(r => r.AcknowledgedByStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VisitRecordRule>()
            .HasOne(v => v.Area)
            .WithMany()
            .HasForeignKey(v => v.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VisitRecord>()
            .HasOne(v => v.Elderly)
            .WithMany(e => e.VisitRecords)
            .HasForeignKey(v => v.ElderlyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VisitRecord>()
            .HasOne(v => v.Staff)
            .WithMany(s => s.VisitRecords)
            .HasForeignKey(v => v.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VisitRecord>()
            .HasOne(v => v.Rule)
            .WithMany(r => r.VisitRecords)
            .HasForeignKey(v => v.RuleId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ActivityCheckInThreshold>()
            .HasOne(t => t.Area)
            .WithMany()
            .HasForeignKey(t => t.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActivityCheckIn>()
            .HasOne(c => c.Elderly)
            .WithMany(e => e.ActivityCheckIns)
            .HasForeignKey(c => c.ElderlyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityCheckIn>()
            .HasOne(c => c.Staff)
            .WithMany(s => s.ActivityCheckIns)
            .HasForeignKey(c => c.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActivityCheckIn>()
            .HasOne(c => c.Threshold)
            .WithMany(t => t.ActivityCheckIns)
            .HasForeignKey(c => c.ThresholdId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RiskEvent>()
            .HasOne(r => r.Elderly)
            .WithMany(e => e.RiskEvents)
            .HasForeignKey(r => r.ElderlyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RiskEvent>()
            .HasOne(r => r.Area)
            .WithMany(a => a.RiskEvents)
            .HasForeignKey(r => r.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RiskEvent>()
            .HasOne(r => r.ReportedByStaff)
            .WithMany(s => s.ReportedRiskEvents)
            .HasForeignKey(r => r.ReportedByStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RiskEvent>()
            .HasOne(r => r.AssignedStaff)
            .WithMany(s => s.AssignedRiskEvents)
            .HasForeignKey(r => r.AssignedStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RiskEventReminder>()
            .HasOne(r => r.RiskEvent)
            .WithMany(e => e.Reminders)
            .HasForeignKey(r => r.RiskEventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RiskEventReminder>()
            .HasOne(r => r.Staff)
            .WithMany(s => s.RiskEventReminders)
            .HasForeignKey(r => r.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RiskEventReminder>()
            .HasOne(r => r.ParentReminder)
            .WithMany(c => c.ChildReminders)
            .HasForeignKey(r => r.ParentReminderId)
            .OnDelete(DeleteBehavior.Restrict);

        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>().HasData(
            new Area { Id = 1, Name = "Sunshine Wing", Description = "Ground floor - ambulatory residents" },
            new Area { Id = 2, Name = "Garden Court", Description = "First floor - residents requiring moderate assistance" },
            new Area { Id = 3, Name = "Harbor View", Description = "Second floor - high-care residents" }
        );

        modelBuilder.Entity<Staff>().HasData(
            new Staff { Id = 1, Name = "Dr. Sarah Chen", Role = "Physician", Phone = "555-0101", Email = "sarah.chen@eldercare.com", AreaId = 1 },
            new Staff { Id = 2, Name = "Nurse Tom Baker", Role = "Head Nurse", Phone = "555-0102", Email = "tom.baker@eldercare.com", AreaId = 1 },
            new Staff { Id = 3, Name = "Nurse Lisa Park", Role = "Nurse", Phone = "555-0103", Email = "lisa.park@eldercare.com", AreaId = 2 },
            new Staff { Id = 4, Name = "Caregiver Mike Ross", Role = "Caregiver", Phone = "555-0104", Email = "mike.ross@eldercare.com", AreaId = 2 },
            new Staff { Id = 5, Name = "Dr. Emily Ward", Role = "Physician", Phone = "555-0105", Email = "emily.ward@eldercare.com", AreaId = 3 }
        );

        modelBuilder.Entity<ElderlyProfile>().HasData(
            new ElderlyProfile { Id = 1, Name = "Margaret Johnson", Gender = "Female", BirthDate = new DateTime(1940, 3, 15), RoomNumber = "A-101", AreaId = 1, PrimaryStaffId = 1, HealthConditions = "Hypertension, Diabetes Type 2", EmergencyContact = "Robert Johnson", EmergencyPhone = "555-1001", AdmissionDate = new DateTime(2023, 1, 10), Status = "Active" },
            new ElderlyProfile { Id = 2, Name = "William Davis", Gender = "Male", BirthDate = new DateTime(1938, 7, 22), RoomNumber = "A-102", AreaId = 1, PrimaryStaffId = 2, HealthConditions = "Arthritis, Mild Cognitive Impairment", EmergencyContact = "Susan Davis", EmergencyPhone = "555-1002", AdmissionDate = new DateTime(2023, 3, 5), Status = "Active" },
            new ElderlyProfile { Id = 3, Name = "Helen Thompson", Gender = "Female", BirthDate = new DateTime(1942, 11, 8), RoomNumber = "B-201", AreaId = 2, PrimaryStaffId = 3, HealthConditions = "Osteoporosis, Atrial Fibrillation", EmergencyContact = "David Thompson", EmergencyPhone = "555-1003", AdmissionDate = new DateTime(2023, 5, 20), Status = "Active" },
            new ElderlyProfile { Id = 4, Name = "Robert Wilson", Gender = "Male", BirthDate = new DateTime(1935, 1, 30), RoomNumber = "B-202", AreaId = 2, PrimaryStaffId = 4, HealthConditions = "Parkinson's Disease, Hypertension", EmergencyContact = "Jane Wilson", EmergencyPhone = "555-1004", AdmissionDate = new DateTime(2023, 8, 15), Status = "Active" },
            new ElderlyProfile { Id = 5, Name = "Dorothy Brown", Gender = "Female", BirthDate = new DateTime(1936, 9, 12), RoomNumber = "C-301", AreaId = 3, PrimaryStaffId = 5, HealthConditions = "Dementia, Diabetes Type 2, Falls Risk", EmergencyContact = "James Brown", EmergencyPhone = "555-1005", AdmissionDate = new DateTime(2022, 11, 1), Status = "Active" }
        );

        modelBuilder.Entity<MedicationDictionary>().HasData(
            new MedicationDictionary { Id = 1, MedicineName = "Metformin", GenericName = "Metformin HCl", DosageForm = "Tablet", DefaultDosage = "500mg", Unit = "mg", Frequency = "Twice daily", Category = "Antidiabetic", SideEffects = "Nausea, Diarrhea, Stomach upset", Contraindications = "Kidney disease, Liver disease", IsActive = true },
            new MedicationDictionary { Id = 2, MedicineName = "Lisinopril", GenericName = "Lisinopril", DosageForm = "Tablet", DefaultDosage = "10mg", Unit = "mg", Frequency = "Once daily", Category = "ACE Inhibitor", SideEffects = "Dizziness, Dry cough, Headache", Contraindications = "Angioedema, Pregnancy", IsActive = true },
            new MedicationDictionary { Id = 3, MedicineName = "Amlodipine", GenericName = "Amlodipine Besylate", DosageForm = "Tablet", DefaultDosage = "5mg", Unit = "mg", Frequency = "Once daily", Category = "Calcium Channel Blocker", SideEffects = "Swelling, Flushing, Fatigue", Contraindications = "Severe aortic stenosis", IsActive = true },
            new MedicationDictionary { Id = 4, MedicineName = "Warfarin", GenericName = "Warfarin Sodium", DosageForm = "Tablet", DefaultDosage = "5mg", Unit = "mg", Frequency = "Once daily", Category = "Anticoagulant", SideEffects = "Bleeding, Bruising", Contraindications = "Active bleeding, Pregnancy", IsActive = true },
            new MedicationDictionary { Id = 5, MedicineName = "Levodopa/Carbidopa", GenericName = "Levodopa/Carbidopa", DosageForm = "Tablet", DefaultDosage = "100/25mg", Unit = "mg", Frequency = "Three times daily", Category = "Antiparkinsonian", SideEffects = "Nausea, Dizziness, Dyskinesia", Contraindications = "Narrow-angle glaucoma", IsActive = true },
            new MedicationDictionary { Id = 6, MedicineName = "Donepezil", GenericName = "Donepezil HCl", DosageForm = "Tablet", DefaultDosage = "10mg", Unit = "mg", Frequency = "Once daily at bedtime", Category = "Cholinesterase Inhibitor", SideEffects = "Nausea, Insomnia, Muscle cramps", Contraindications = "Heart block, Bladder obstruction", IsActive = true },
            new MedicationDictionary { Id = 7, MedicineName = "Calcium + Vitamin D", GenericName = "Calcium Carbonate/Cholecalciferol", DosageForm = "Tablet", DefaultDosage = "600mg/400IU", Unit = "mg/IU", Frequency = "Twice daily", Category = "Supplement", SideEffects = "Constipation, Bloating", Contraindications = "Hypercalcemia, Kidney stones", IsActive = true },
            new MedicationDictionary { Id = 8, MedicineName = "Aspirin", GenericName = "Acetylsalicylic Acid", DosageForm = "Tablet", DefaultDosage = "81mg", Unit = "mg", Frequency = "Once daily", Category = "Antiplatelet", SideEffects = "Stomach irritation, Bleeding", Contraindications = "Bleeding disorders, Active ulcer", IsActive = true }
        );

        modelBuilder.Entity<MedicationSchedule>().HasData(
            new MedicationSchedule { Id = 1, ElderlyId = 1, MedicationDictId = 1, Dosage = "500mg", Frequency = "Twice daily", StartTime = new DateTime(2024, 1, 1), EndTime = null, TimeOfDay = "08:00,18:00", Instructions = "Take with meals", Status = MedicationStatus.Active, CreatedByStaffId = 1 },
            new MedicationSchedule { Id = 2, ElderlyId = 1, MedicationDictId = 2, Dosage = "10mg", Frequency = "Once daily", StartTime = new DateTime(2024, 1, 1), EndTime = null, TimeOfDay = "08:00", Instructions = "Take in the morning", Status = MedicationStatus.Active, CreatedByStaffId = 1 },
            new MedicationSchedule { Id = 3, ElderlyId = 3, MedicationDictId = 4, Dosage = "5mg", Frequency = "Once daily", StartTime = new DateTime(2024, 2, 1), EndTime = null, TimeOfDay = "18:00", Instructions = "Take at same time daily, avoid cranberry", Status = MedicationStatus.Active, CreatedByStaffId = 3 },
            new MedicationSchedule { Id = 4, ElderlyId = 3, MedicationDictId = 7, Dosage = "600mg/400IU", Frequency = "Twice daily", StartTime = new DateTime(2024, 2, 1), EndTime = null, TimeOfDay = "08:00,20:00", Instructions = "Take with food", Status = MedicationStatus.Active, CreatedByStaffId = 3 },
            new MedicationSchedule { Id = 5, ElderlyId = 4, MedicationDictId = 5, Dosage = "100/25mg", Frequency = "Three times daily", StartTime = new DateTime(2024, 3, 1), EndTime = null, TimeOfDay = "07:00,12:00,17:00", Instructions = "Take on empty stomach if possible", Status = MedicationStatus.Active, CreatedByStaffId = 4 },
            new MedicationSchedule { Id = 6, ElderlyId = 5, MedicationDictId = 6, Dosage = "10mg", Frequency = "Once daily at bedtime", StartTime = new DateTime(2024, 1, 1), EndTime = null, TimeOfDay = "21:00", Instructions = "Take at bedtime", Status = MedicationStatus.Active, CreatedByStaffId = 5 },
            new MedicationSchedule { Id = 7, ElderlyId = 5, MedicationDictId = 1, Dosage = "250mg", Frequency = "Twice daily", StartTime = new DateTime(2024, 1, 1), EndTime = null, TimeOfDay = "08:00,18:00", Instructions = "Reduced dose for renal function", Status = MedicationStatus.Active, CreatedByStaffId = 5 },
            new MedicationSchedule { Id = 8, ElderlyId = 2, MedicationDictId = 3, Dosage = "5mg", Frequency = "Once daily", StartTime = new DateTime(2024, 4, 1), EndTime = null, TimeOfDay = "08:00", Instructions = "Monitor blood pressure", Status = MedicationStatus.Active, CreatedByStaffId = 2 }
        );

        modelBuilder.Entity<VisitRecordRule>().HasData(
            new VisitRecordRule { Id = 1, Name = "Daily Wellness Check", FrequencyDays = 1, RequiredDurationMinutes = 15, AreaId = null, Priority = "Normal", IsActive = true },
            new VisitRecordRule { Id = 2, Name = "Weekly Medical Review", FrequencyDays = 7, RequiredDurationMinutes = 30, AreaId = null, Priority = "Important", IsActive = true },
            new VisitRecordRule { Id = 3, Name = "High-Risk Daily Assessment", FrequencyDays = 1, RequiredDurationMinutes = 30, AreaId = 3, Priority = "Critical", IsActive = true }
        );

        modelBuilder.Entity<ActivityCheckInThreshold>().HasData(
            new ActivityCheckInThreshold { Id = 1, ActivityName = "Morning Exercise", RequiredCheckIns = 5, PeriodDays = 7, AreaId = null, IsActive = true },
            new ActivityCheckInThreshold { Id = 2, ActivityName = "Social Activity", RequiredCheckIns = 3, PeriodDays = 7, AreaId = null, IsActive = true },
            new ActivityCheckInThreshold { Id = 3, ActivityName = "Cognitive Stimulation", RequiredCheckIns = 4, PeriodDays = 7, AreaId = 3, IsActive = true }
        );
    }
}
