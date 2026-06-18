using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public class PartsService : IPartsService
{
    private readonly AppointmentDbContext _context;

    public PartsService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<PartsDto> GetByIdAsync(int id)
    {
        var parts = await _context.Parts.FindAsync(id);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {id}");

        return MapToDto(parts);
    }

    public async Task<List<PartsDto>> GetAllAsync()
    {
        var parts = await _context.Parts
            .OrderBy(p => p.Name)
            .ToListAsync();

        return parts.Select(MapToDto).ToList();
    }

    public async Task<PagedResultDto<PartsDto>> GetPagedAsync(int pageIndex, int pageSize, string? keyword = null)
    {
        var query = _context.Parts.AsQueryable();

        if (!string.IsNullOrEmpty(keyword))
            query = query.Where(p => p.Name.Contains(keyword) || p.PartNumber.Contains(keyword));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<PartsDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    public async Task<List<PartsDto>> GetLowStockAsync()
    {
        var parts = await _context.Parts
            .Where(p => p.StockQuantity < p.SafetyStock)
            .OrderBy(p => p.StockQuantity)
            .ToListAsync();

        return parts.Select(MapToDto).ToList();
    }

    public async Task<PartsDto> CreateAsync(CreatePartsDto dto)
    {
        if (await _context.Parts.AnyAsync(p => p.PartNumber == dto.PartNumber))
            throw new InvalidOperationException($"配件编号已存在: {dto.PartNumber}");

        var parts = new Parts
        {
            PartNumber = dto.PartNumber,
            Name = dto.Name,
            Specification = dto.Specification,
            StockQuantity = dto.StockQuantity,
            SafetyStock = dto.SafetyStock,
            UnitPrice = dto.UnitPrice,
            Supplier = dto.Supplier,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Parts.Add(parts);
        await _context.SaveChangesAsync();

        return MapToDto(parts);
    }

    public async Task<PartsDto> UpdateAsync(int id, UpdatePartsDto dto)
    {
        var parts = await _context.Parts.FindAsync(id);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {id}");

        parts.Name = dto.Name;
        parts.Specification = dto.Specification;
        parts.SafetyStock = dto.SafetyStock;
        parts.UnitPrice = dto.UnitPrice;
        parts.Supplier = dto.Supplier;
        parts.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return MapToDto(parts);
    }

    public async Task DeleteAsync(int id)
    {
        var parts = await _context.Parts.FindAsync(id);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {id}");

        var hasShortageRecords = await _context.PartsShortageRecords
            .AnyAsync(r => r.PartsId == id);

        if (hasShortageRecords)
            throw new InvalidOperationException("该配件有关联的缺货记录，不能删除");

        _context.Parts.Remove(parts);
        await _context.SaveChangesAsync();
    }

    public async Task<PartsDto> AddStockAsync(int id, UpdateStockDto dto)
    {
        var parts = await _context.Parts.FindAsync(id);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {id}");

        if (dto.Quantity <= 0)
            throw new ArgumentException("入库数量必须大于0");

        parts.StockQuantity += dto.Quantity;
        parts.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return MapToDto(parts);
    }

    public async Task<PartsDto> ReduceStockAsync(int id, UpdateStockDto dto)
    {
        var parts = await _context.Parts.FindAsync(id);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {id}");

        if (dto.Quantity <= 0)
            throw new ArgumentException("出库数量必须大于0");

        if (parts.StockQuantity < dto.Quantity)
            throw new InvalidOperationException($"库存不足，当前库存: {parts.StockQuantity}");

        parts.StockQuantity -= dto.Quantity;
        parts.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return MapToDto(parts);
    }

    public async Task<List<PartsShortageRecordDto>> GetAllShortageRecordsAsync()
    {
        var records = await _context.PartsShortageRecords
            .Include(r => r.Appointment)
            .Include(r => r.Parts)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return records.Select(r => MapToShortageDto(r)).ToList();
    }

    public async Task<PartsShortageRecordDto> CreateShortageRecordAsync(int appointmentId, PartsShortageHandleDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(appointmentId);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {appointmentId}");

        var parts = await _context.Parts.FindAsync(dto.PartsId);
        if (parts == null)
            throw new KeyNotFoundException($"配件不存在: {dto.PartsId}");

        var record = new PartsShortageRecord
        {
            AppointmentId = appointmentId,
            PartsId = dto.PartsId,
            ShortageQuantity = dto.ShortageQuantity,
            ExpectedArrivalTime = dto.ExpectedArrivalTime,
            Status = PartsShortageStatus.Pending,
            Handler = dto.Handler,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        appointment.Status = AppointmentStatus.PartsShortage;
        appointment.UpdatedAt = DateTime.Now;

        _context.PartsShortageRecords.Add(record);
        await _context.SaveChangesAsync();

        return MapToShortageDto(record);
    }

    public async Task<PartsShortageRecordDto> ResolveShortageRecordAsync(int id)
    {
        var record = await _context.PartsShortageRecords
            .Include(r => r.Appointment)
            .Include(r => r.Parts)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (record == null)
            throw new KeyNotFoundException($"缺货记录不存在: {id}");

        record.Status = PartsShortageStatus.Resolved;
        record.ActualArrivalTime = DateTime.Now;
        record.UpdatedAt = DateTime.Now;

        if (record.Appointment != null)
        {
            var hasUnresolved = await _context.PartsShortageRecords
                .AnyAsync(r => r.AppointmentId == record.AppointmentId
                            && r.Status != PartsShortageStatus.Resolved
                            && r.Status != PartsShortageStatus.Cancelled);

            if (!hasUnresolved)
            {
                record.Appointment.Status = AppointmentStatus.InService;
            }
        }

        await _context.SaveChangesAsync();
        return MapToShortageDto(record);
    }

    private static PartsShortageRecordDto MapToShortageDto(PartsShortageRecord r)
    {
        return new PartsShortageRecordDto
        {
            Id = r.Id,
            AppointmentId = r.AppointmentId,
            AppointmentNo = r.Appointment?.AppointmentNo ?? string.Empty,
            PartsId = r.PartsId,
            PartName = r.Parts?.Name ?? string.Empty,
            PartCode = r.Parts?.PartNumber,
            ShortageQuantity = r.ShortageQuantity,
            ExpectedArrivalTime = r.ExpectedArrivalTime,
            ActualArrivalTime = r.ActualArrivalTime,
            Status = r.Status,
            Handler = r.Handler,
            Remarks = r.Remarks,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }

    private static PartsDto MapToDto(Parts parts)
    {
        return new PartsDto
        {
            Id = parts.Id,
            PartNumber = parts.PartNumber,
            Name = parts.Name,
            Specification = parts.Specification,
            StockQuantity = parts.StockQuantity,
            SafetyStock = parts.SafetyStock,
            UnitPrice = parts.UnitPrice,
            Supplier = parts.Supplier,
            CreatedAt = parts.CreatedAt,
            UpdatedAt = parts.UpdatedAt
        };
    }
}
