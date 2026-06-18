using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public class AppointmentService : IAppointmentService
{
    private readonly AppointmentDbContext _context;

    public AppointmentService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<AppointmentDetailDto> GetByIdAsync(int id)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        return MapToDetailDto(appointment);
    }

    public async Task<AppointmentDetailDto> GetDetailAsync(int id)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Vehicle)
            .Include(a => a.Quotes)
                .ThenInclude(q => q.QuoteItems)
            .Include(a => a.InspectionPhotos)
            .Include(a => a.PartsShortageRecords)
                .ThenInclude(p => p.Parts)
            .Include(a => a.ServiceRecords)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        var detailDto = MapToDetailDto(appointment);

        if (appointment.Quotes != null && appointment.Quotes.Count > 0)
        {
            var quote = appointment.Quotes.OrderByDescending(q => q.CreatedAt).First();
            detailDto.Quote = MapToQuoteDto(quote);
        }

        if (appointment.InspectionPhotos != null)
        {
            detailDto.Photos = appointment.InspectionPhotos
                .Select(p => new InspectionPhotoDto
                {
                    Id = p.Id,
                    AppointmentId = p.AppointmentId,
                    PhotoUrl = p.PhotoUrl,
                    PhotoType = p.PhotoType,
                    UploadTime = p.UploadTime,
                    Uploader = p.Uploader,
                    Remarks = p.Remarks
                })
                .OrderByDescending(p => p.UploadTime)
                .ToList();
        }

        if (appointment.PartsShortageRecords != null)
        {
            detailDto.PartsShortages = appointment.PartsShortageRecords
                .Select(r => new PartsShortageRecordDto
                {
                    Id = r.Id,
                    AppointmentId = r.AppointmentId,
                    AppointmentNo = appointment.AppointmentNo,
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
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToList();
        }

        if (appointment.ServiceRecords != null)
        {
            detailDto.ServiceRecords = appointment.ServiceRecords
                .Select(r => new ServiceRecordDto
                {
                    Id = r.Id,
                    AppointmentId = r.AppointmentId,
                    ServiceItem = r.ServiceItem,
                    Technician = r.ServicePerson,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                    Conclusion = r.Conclusion,
                    CreatedAt = r.CreatedAt
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToList();
        }

        detailDto.HistoryRecords = await GetHistoryRecordsAsync(appointment.VehicleId, id);

        return detailDto;
    }

    public async Task<List<AppointmentListDto>> GetListAsync(AppointmentStatus? status, string? keyword)
    {
        var queryable = _context.Appointments
            .Include(a => a.Vehicle)
            .AsQueryable();

        if (status.HasValue)
            queryable = queryable.Where(a => a.Status == status.Value);

        if (!string.IsNullOrEmpty(keyword))
        {
            keyword = keyword.Trim().ToLower();
            queryable = queryable.Where(a =>
                a.Vehicle!.PlateNumber.ToLower().Contains(keyword) ||
                a.AppointmentNo.ToLower().Contains(keyword) ||
                a.Vehicle.OwnerName.ToLower().Contains(keyword)
            );
        }

        var items = await queryable
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AppointmentListDto
            {
                Id = a.Id,
                AppointmentNo = a.AppointmentNo,
                VehicleId = a.VehicleId,
                PlateNumber = a.Vehicle!.PlateNumber,
                OwnerName = a.Vehicle.OwnerName,
                Brand = a.Vehicle.Brand,
                Model = a.Vehicle.Model,
                AppointmentTime = a.AppointmentTime,
                CheckInTime = a.CheckInTime,
                Source = a.Source,
                PersonInCharge = a.PersonInCharge,
                Status = a.Status,
                FaultDescription = a.FaultDescription
            })
            .ToListAsync();

        return items;
    }

    public async Task<PagedResultDto<AppointmentListDto>> GetPagedAsync(AppointmentQueryDto query)
    {
        var queryable = _context.Appointments
            .Include(a => a.Vehicle)
            .AsQueryable();

        if (query.Status.HasValue)
            queryable = queryable.Where(a => a.Status == query.Status.Value);

        if (query.Source.HasValue)
            queryable = queryable.Where(a => a.Source == query.Source.Value);

        if (!string.IsNullOrEmpty(query.PersonInCharge))
            queryable = queryable.Where(a => a.PersonInCharge == query.PersonInCharge);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(a => a.AppointmentTime >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(a => a.AppointmentTime <= query.EndDate.Value);

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            var keyword = query.Keyword.Trim().ToLower();
            queryable = queryable.Where(a =>
                a.Vehicle!.PlateNumber.ToLower().Contains(keyword) ||
                a.AppointmentNo.ToLower().Contains(keyword) ||
                a.Vehicle.OwnerName.ToLower().Contains(keyword)
            );
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(a => a.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => new AppointmentListDto
            {
                Id = a.Id,
                AppointmentNo = a.AppointmentNo,
                VehicleId = a.VehicleId,
                PlateNumber = a.Vehicle!.PlateNumber,
                OwnerName = a.Vehicle.OwnerName,
                Brand = a.Vehicle.Brand,
                Model = a.Vehicle.Model,
                AppointmentTime = a.AppointmentTime,
                CheckInTime = a.CheckInTime,
                Source = a.Source,
                PersonInCharge = a.PersonInCharge,
                Status = a.Status,
                FaultDescription = a.FaultDescription
            })
            .ToListAsync();

        return new PagedResultDto<AppointmentListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto)
    {
        var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
        if (vehicle == null)
            throw new KeyNotFoundException($"车辆不存在: {dto.VehicleId}");

        var appointmentNo = GenerateAppointmentNo();

        var appointment = new Appointment
        {
            AppointmentNo = appointmentNo,
            VehicleId = dto.VehicleId,
            AppointmentTime = dto.AppointmentTime,
            Source = dto.Source,
            PersonInCharge = dto.PersonInCharge,
            Status = AppointmentStatus.Pending,
            FaultDescription = dto.FaultDescription,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return MapToDto(appointment, vehicle);
    }

    public async Task<AppointmentDto> UpdateAsync(int id, UpdateAppointmentDto dto)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        appointment.AppointmentTime = dto.AppointmentTime;
        appointment.PersonInCharge = dto.PersonInCharge;
        appointment.FaultDescription = dto.FaultDescription;
        appointment.Remarks = dto.Remarks;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return MapToDto(appointment);
    }

    public async Task DeleteAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
    }

    public async Task<AppointmentDetailDto> ChangeStatusAsync(int id, ChangeStatusDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        appointment.Status = dto.Status;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> CheckInAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.Pending)
            throw new InvalidOperationException("只有待进厂状态的预约单才能进厂");

        appointment.Status = AppointmentStatus.InService;
        appointment.CheckInTime = DateTime.Now;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> CompleteAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.InService)
            throw new InvalidOperationException("只有维修中状态的预约单才能完成");

        appointment.Status = AppointmentStatus.Completed;
        appointment.CompletionTime = DateTime.Now;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> CloseAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.Completed)
            throw new InvalidOperationException("只有已完成状态的预约单才能关闭");

        appointment.Status = AppointmentStatus.Closed;
        appointment.CloseTime = DateTime.Now;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> ReopenAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.Closed)
            throw new InvalidOperationException("只有已关闭状态的预约单才能重开");

        appointment.Status = AppointmentStatus.InService;
        appointment.CloseTime = null;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<PartsShortageRecordDto> AddPartsShortageAsync(int appointmentId, PartsShortageHandleDto dto)
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

        return await MapToShortageDto(record);
    }

    public async Task<List<PartsShortageRecordDto>> GetPartsShortagesAsync(int appointmentId)
    {
        var records = await _context.PartsShortageRecords
            .Include(r => r.Parts)
            .Include(r => r.Appointment)
            .Where(r => r.AppointmentId == appointmentId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = new List<PartsShortageRecordDto>();
        foreach (var record in records)
        {
            dtos.Add(await MapToShortageDto(record));
        }

        return dtos;
    }

    public async Task<AppointmentDetailDto> ResolvePartsShortageAsync(int appointmentId, int shortageId)
    {
        var appointment = await _context.Appointments.FindAsync(appointmentId);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {appointmentId}");

        var record = await _context.PartsShortageRecords.FindAsync(shortageId);
        if (record == null)
            throw new KeyNotFoundException($"缺货记录不存在: {shortageId}");

        if (record.AppointmentId != appointmentId)
            throw new InvalidOperationException("缺货记录不属于该预约单");

        record.Status = PartsShortageStatus.Resolved;
        record.ActualArrivalTime = DateTime.Now;
        record.UpdatedAt = DateTime.Now;

        var hasUnresolved = await _context.PartsShortageRecords
            .AnyAsync(r => r.Id != shortageId && r.AppointmentId == appointmentId && r.Status != PartsShortageStatus.Resolved && r.Status != PartsShortageStatus.Cancelled);

        if (!hasUnresolved)
        {
            appointment.Status = AppointmentStatus.InService;
        }

        appointment.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return await GetDetailAsync(appointmentId);
    }

    public async Task<AppointmentDetailDto> SupplementDataAsync(int id, DataSupplementDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.DataIncomplete)
            throw new InvalidOperationException("只有资料待补状态的预约单才能补录资料");

        appointment.Status = AppointmentStatus.InService;
        appointment.Remarks = dto.Remarks;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> RequestReviewAsync(int id, string? remarks)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.InService)
            throw new InvalidOperationException("只有维修中状态的预约单才能申请升级复核");

        appointment.Status = AppointmentStatus.ReviewRequired;
        appointment.Remarks = remarks;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    public async Task<AppointmentDetailDto> ProcessReviewAsync(int id, ReviewDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {id}");

        if (appointment.Status != AppointmentStatus.ReviewRequired)
            throw new InvalidOperationException("只有升级复核状态的预约单才能处理复核");

        appointment.Status = AppointmentStatus.InService;
        appointment.Remarks = dto.Remarks;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetDetailAsync(id);
    }

    private static string GenerateAppointmentNo()
    {
        return $"AP{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private static AppointmentDto MapToDto(Appointment appointment, Vehicle? vehicle = null)
    {
        var dto = new AppointmentDto
        {
            Id = appointment.Id,
            AppointmentNo = appointment.AppointmentNo,
            VehicleId = appointment.VehicleId,
            AppointmentTime = appointment.AppointmentTime,
            CheckInTime = appointment.CheckInTime,
            CompletionTime = appointment.CompletionTime,
            CloseTime = appointment.CloseTime,
            Source = appointment.Source,
            PersonInCharge = appointment.PersonInCharge,
            Status = appointment.Status,
            FaultDescription = appointment.FaultDescription,
            Remarks = appointment.Remarks,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        var v = vehicle ?? appointment.Vehicle;
        if (v != null)
        {
            dto.Vehicle = new VehicleDto
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                VinNumber = v.VinNumber,
                Brand = v.Brand,
                Model = v.Model,
                OwnerName = v.OwnerName,
                OwnerPhone = v.OwnerPhone,
                Mileage = v.Mileage,
                LastMaintenanceDate = v.LastMaintenanceDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            };
        }

        return dto;
    }

    private static AppointmentDetailDto MapToDetailDto(Appointment appointment)
    {
        var detailDto = new AppointmentDetailDto
        {
            Id = appointment.Id,
            AppointmentNo = appointment.AppointmentNo,
            VehicleId = appointment.VehicleId,
            AppointmentTime = appointment.AppointmentTime,
            CheckInTime = appointment.CheckInTime,
            CompletionTime = appointment.CompletionTime,
            CloseTime = appointment.CloseTime,
            Source = appointment.Source,
            PersonInCharge = appointment.PersonInCharge,
            Status = appointment.Status,
            FaultDescription = appointment.FaultDescription,
            Remarks = appointment.Remarks,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        if (appointment.Vehicle != null)
        {
            detailDto.Vehicle = new VehicleDto
            {
                Id = appointment.Vehicle.Id,
                PlateNumber = appointment.Vehicle.PlateNumber,
                VinNumber = appointment.Vehicle.VinNumber,
                Brand = appointment.Vehicle.Brand,
                Model = appointment.Vehicle.Model,
                OwnerName = appointment.Vehicle.OwnerName,
                OwnerPhone = appointment.Vehicle.OwnerPhone,
                Mileage = appointment.Vehicle.Mileage,
                LastMaintenanceDate = appointment.Vehicle.LastMaintenanceDate,
                CreatedAt = appointment.Vehicle.CreatedAt,
                UpdatedAt = appointment.Vehicle.UpdatedAt
            };
        }

        return detailDto;
    }

    private static QuoteDto MapToQuoteDto(Quote quote)
    {
        var quoteDto = new QuoteDto
        {
            Id = quote.Id,
            AppointmentId = quote.AppointmentId,
            LaborCost = quote.LaborCost,
            PartsCost = quote.PartsCost,
            TotalAmount = quote.TotalAmount,
            Status = quote.Status,
            Remarks = quote.Remarks,
            CreatedAt = quote.CreatedAt,
            UpdatedAt = quote.UpdatedAt
        };

        if (quote.QuoteItems != null)
        {
            quoteDto.QuoteItems = quote.QuoteItems
                .Select(item => new QuoteItemDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Type = item.Type,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Subtotal = item.Subtotal,
                    Remarks = item.Remarks
                })
                .ToList();
        }

        return quoteDto;
    }

    private async Task<PartsShortageRecordDto> MapToShortageDto(PartsShortageRecord record)
    {
        var dto = new PartsShortageRecordDto
        {
            Id = record.Id,
            AppointmentId = record.AppointmentId,
            PartsId = record.PartsId,
            ShortageQuantity = record.ShortageQuantity,
            ExpectedArrivalTime = record.ExpectedArrivalTime,
            ActualArrivalTime = record.ActualArrivalTime,
            Status = record.Status,
            Handler = record.Handler,
            Remarks = record.Remarks,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt
        };

        if (record.Appointment != null)
        {
            dto.AppointmentNo = record.Appointment.AppointmentNo;
        }
        else
        {
            var appointment = await _context.Appointments.FindAsync(record.AppointmentId);
            dto.AppointmentNo = appointment?.AppointmentNo ?? string.Empty;
        }

        if (record.Parts != null)
        {
            dto.PartName = record.Parts.Name;
            dto.PartCode = record.Parts.PartNumber;
        }
        else
        {
            var parts = await _context.Parts.FindAsync(record.PartsId);
            dto.PartName = parts?.Name ?? string.Empty;
            dto.PartCode = parts?.PartNumber;
        }

        return dto;
    }

    private async Task<List<HistoryRecordDto>> GetHistoryRecordsAsync(int vehicleId, int currentAppointmentId)
    {
        var historyAppointments = await _context.Appointments
            .Include(a => a.Quotes)
            .Where(a => a.VehicleId == vehicleId && a.Id != currentAppointmentId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToListAsync();

        var historyRecords = new List<HistoryRecordDto>();

        foreach (var appt in historyAppointments)
        {
            var amount = appt.Quotes != null && appt.Quotes.Count > 0
                ? appt.Quotes.OrderByDescending(q => q.CreatedAt).First().TotalAmount
                : 0;

            historyRecords.Add(new HistoryRecordDto
            {
                Id = appt.Id,
                AppointmentNo = appt.AppointmentNo,
                Date = appt.AppointmentTime,
                ServiceType = appt.FaultDescription ?? "维修服务",
                Description = appt.Remarks ?? string.Empty,
                Amount = amount,
                Handler = appt.PersonInCharge,
                Status = appt.Status
            });
        }

        return historyRecords;
    }
}
