using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Payment;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
using HomeImprovementPlatform.API.Data;

namespace HomeImprovementPlatform.API.Services;

public interface IPaymentService
{
    Task<IEnumerable<PaymentRecordDto>> GetAllAsync(PaymentStatus? status, Guid? projectId);
    Task<PaymentRecordDto> GetByIdAsync(Guid id);
    Task<PaymentRecordDto> CreateAsync(CreatePaymentDto dto, Guid recordedById);
    Task<PaymentRecordDto> UpdateAsync(Guid id, UpdatePaymentDto dto, Guid updatedById);
    Task DeleteAsync(Guid id);
}

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PaymentService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PaymentRecordDto>> GetAllAsync(PaymentStatus? status, Guid? projectId)
    {
        var query = _context.PaymentRecords
            .Include(p => p.Project)
            .Include(p => p.Document)
            .Include(p => p.RecordedBy)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);

        if (projectId.HasValue)
            query = query.Where(p => p.ProjectId == projectId.Value);

        var payments = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<IEnumerable<PaymentRecordDto>>(payments);
    }

    public async Task<PaymentRecordDto> GetByIdAsync(Guid id)
    {
        var payment = await _context.PaymentRecords
            .Include(p => p.Project)
            .Include(p => p.Document)
            .Include(p => p.RecordedBy)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            throw new KeyNotFoundException($"Payment record with id {id} not found");

        return _mapper.Map<PaymentRecordDto>(payment);
    }

    public async Task<PaymentRecordDto> CreateAsync(CreatePaymentDto dto, Guid recordedById)
    {
        var payment = _mapper.Map<PaymentRecord>(dto);
        payment.PaymentNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        payment.RecordedById = recordedById;
        payment.CreatedAt = DateTime.UtcNow;

        _context.PaymentRecords.Add(payment);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(payment.Id);
    }

    public async Task<PaymentRecordDto> UpdateAsync(Guid id, UpdatePaymentDto dto, Guid updatedById)
    {
        var payment = await _context.PaymentRecords.FindAsync(id);
        if (payment == null)
            throw new KeyNotFoundException($"Payment record with id {id} not found");

        _mapper.Map(dto, payment);
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var payment = await _context.PaymentRecords.FindAsync(id);
        if (payment == null)
            throw new KeyNotFoundException($"Payment record with id {id} not found");

        _context.PaymentRecords.Remove(payment);
        await _context.SaveChangesAsync();
    }
}
