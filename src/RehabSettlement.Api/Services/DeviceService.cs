using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Services;

public interface IDeviceService
{
    Task<List<DeviceDto>> GetAllDevicesAsync();
    Task<DeviceDto?> GetDeviceByIdAsync(int id);
    Task<List<DeviceUsageRecordDto>> GetUsageRecordsByBillIdAsync(int billId);
    Task<List<DeviceUsageRecordDto>> GetUsageRecordsByDeviceIdAsync(int deviceId);
    Task<DeviceUsageRecordDto> AddUsageRecordAsync(DeviceUsageRecordDto dto);
}

public class DeviceService : IDeviceService
{
    private readonly AppDbContext _context;

    public DeviceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DeviceDto>> GetAllDevicesAsync()
    {
        return await _context.Devices
            .Select(d => new DeviceDto
            {
                Id = d.Id,
                DeviceCode = d.DeviceCode,
                DeviceName = d.DeviceName,
                DeviceType = d.DeviceType,
                Model = d.Model,
                StatusId = d.StatusId,
                StatusName = GetStatusName(d.StatusId),
                Location = d.Location
            })
            .OrderBy(d => d.DeviceCode)
            .ToListAsync();
    }

    public async Task<DeviceDto?> GetDeviceByIdAsync(int id)
    {
        var device = await _context.Devices.FindAsync(id);
        return device == null ? null : new DeviceDto
        {
            Id = device.Id,
            DeviceCode = device.DeviceCode,
            DeviceName = device.DeviceName,
            DeviceType = device.DeviceType,
            Model = device.Model,
            StatusId = device.StatusId,
            StatusName = GetStatusName(device.StatusId),
            Location = device.Location
        };
    }

    public async Task<List<DeviceUsageRecordDto>> GetUsageRecordsByBillIdAsync(int billId)
    {
        return await _context.DeviceUsageRecords
            .Include(d => d.Device)
            .Where(d => d.BillId == billId)
            .OrderByDescending(d => d.UseDate)
            .ThenByDescending(d => d.StartTime)
            .Select(d => new DeviceUsageRecordDto
            {
                Id = d.Id,
                DeviceId = d.DeviceId,
                DeviceName = d.Device.DeviceName,
                BillId = d.BillId,
                TreatmentCalendarId = d.TreatmentCalendarId,
                UseDate = d.UseDate,
                StartTime = d.StartTime,
                EndTime = d.EndTime,
                Duration = d.Duration,
                Remark = d.Remark
            })
            .ToListAsync();
    }

    public async Task<List<DeviceUsageRecordDto>> GetUsageRecordsByDeviceIdAsync(int deviceId)
    {
        return await _context.DeviceUsageRecords
            .Include(d => d.Device)
            .Where(d => d.DeviceId == deviceId)
            .OrderByDescending(d => d.UseDate)
            .ThenByDescending(d => d.StartTime)
            .Select(d => new DeviceUsageRecordDto
            {
                Id = d.Id,
                DeviceId = d.DeviceId,
                DeviceName = d.Device.DeviceName,
                BillId = d.BillId,
                TreatmentCalendarId = d.TreatmentCalendarId,
                UseDate = d.UseDate,
                StartTime = d.StartTime,
                EndTime = d.EndTime,
                Duration = d.Duration,
                Remark = d.Remark
            })
            .ToListAsync();
    }

    public async Task<DeviceUsageRecordDto> AddUsageRecordAsync(DeviceUsageRecordDto dto)
    {
        var record = new DeviceUsageRecord
        {
            DeviceId = dto.DeviceId,
            BillId = dto.BillId,
            TreatmentCalendarId = dto.TreatmentCalendarId,
            UseDate = dto.UseDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Duration = dto.Duration,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now
        };

        _context.DeviceUsageRecords.Add(record);
        await _context.SaveChangesAsync();

        dto.Id = record.Id;
        return dto;
    }

    private static string GetStatusName(int statusId)
    {
        return statusId switch
        {
            1 => "正常",
            2 => "维护中",
            3 => "故障",
            4 => "报废",
            _ => "未知"
        };
    }
}
