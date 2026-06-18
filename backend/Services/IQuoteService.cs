using CarServiceAppointment.API.DTOs;

namespace CarServiceAppointment.API.Services;

public interface IQuoteService
{
    Task<QuoteDto> GetByIdAsync(int id);
    Task<List<QuoteDto>> GetByAppointmentIdAsync(int appointmentId);
    Task<QuoteDto> CreateAsync(CreateQuoteDto dto);
    Task<QuoteDto> UpdateAsync(int id, UpdateQuoteDto dto);
    Task<QuoteDto> ConfirmAsync(int id);
    Task<QuoteDto> RejectAsync(int id);
    Task DeleteAsync(int id);
}
