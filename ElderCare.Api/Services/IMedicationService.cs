using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IMedicationService
{
    Task<IEnumerable<MedicationDictDto>> GetAllMedicationsAsync();
    Task<MedicationDictDto?> GetMedicationByIdAsync(int id);
    Task<MedicationDictDto> CreateMedicationAsync(CreateMedicationDictDto dto);
    Task<MedicationDictDto?> UpdateMedicationAsync(int id, UpdateMedicationDictDto dto);
    Task<bool> DeleteMedicationAsync(int id);
    Task<IEnumerable<ScheduleDto>> GetAllSchedulesAsync();
    Task<ScheduleDto?> GetScheduleByIdAsync(int id);
    Task<ScheduleDto> CreateScheduleAsync(CreateScheduleDto dto);
    Task<ScheduleDto?> UpdateScheduleAsync(int id, UpdateScheduleDto dto);
    Task<IEnumerable<ScheduleDto>> GetSchedulesByElderlyAsync(int elderlyId);
    Task<IEnumerable<ReminderLogDto>> GetReminderLogsAsync(int? elderlyId = null, int? scheduleId = null);
    Task<ReminderLogDto> CreateReminderLogAsync(int scheduleId, int elderlyId, DateTime reminderTime);
    Task<ReminderLogDto?> AcknowledgeReminderAsync(int logId, AcknowledgeReminderDto dto);
}
