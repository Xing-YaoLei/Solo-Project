using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class BillingService : IBillingService
{
    private readonly ApplicationDbContext _context;

    public BillingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BillingRecordDto>> GetBillingRecordsAsync(
        int? patientId = null,
        BillingStatus? status = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.BillingRecords
            .Include(b => b.Patient)
            .Include(b => b.BillingItems)
            .AsQueryable();

        if (patientId.HasValue)
            query = query.Where(b => b.PatientId == patientId.Value);

        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);

        if (startDate.HasValue)
            query = query.Where(b => b.BillingDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.BillingDate <= endDate.Value);

        return await query
            .OrderByDescending(b => b.BillingDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BillingRecordDto
            {
                Id = b.Id,
                PatientId = b.PatientId,
                PatientName = b.Patient!.Name,
                AppointmentId = b.AppointmentId,
                TreatmentPlanId = b.TreatmentPlanId,
                InvoiceNo = b.InvoiceNo,
                BillingDate = b.BillingDate,
                TotalAmount = b.TotalAmount,
                DiscountAmount = b.DiscountAmount,
                PaidAmount = b.PaidAmount,
                RemainingAmount = b.RemainingAmount,
                Status = b.Status,
                PaymentMethod = b.PaymentMethod,
                Remarks = b.Remarks,
                Cashier = b.Cashier,
                CreatedAt = b.CreatedAt,
                BillingItems = b.BillingItems
                    .Select(i => new BillingItemDto
                    {
                        Id = i.Id,
                        ItemName = i.ItemName,
                        Description = i.Description,
                        UnitPrice = i.UnitPrice,
                        Quantity = i.Quantity,
                        Subtotal = i.Subtotal
                    }).ToList()
            })
            .ToListAsync();
    }

    public async Task<BillingRecordDto?> GetBillingRecordByIdAsync(int id)
    {
        var record = await _context.BillingRecords
            .Include(b => b.Patient)
            .Include(b => b.BillingItems)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (record == null) return null;

        return new BillingRecordDto
        {
            Id = record.Id,
            PatientId = record.PatientId,
            PatientName = record.Patient!.Name,
            AppointmentId = record.AppointmentId,
            TreatmentPlanId = record.TreatmentPlanId,
            InvoiceNo = record.InvoiceNo,
            BillingDate = record.BillingDate,
            TotalAmount = record.TotalAmount,
            DiscountAmount = record.DiscountAmount,
            PaidAmount = record.PaidAmount,
            RemainingAmount = record.RemainingAmount,
            Status = record.Status,
            PaymentMethod = record.PaymentMethod,
            Remarks = record.Remarks,
            Cashier = record.Cashier,
            CreatedAt = record.CreatedAt,
            BillingItems = record.BillingItems
                .Select(i => new BillingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Description = i.Description,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
        };
    }

    public async Task<BillingRecordDto> CreateBillingRecordAsync(CreateBillingRecordDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        var invoiceNo = await GenerateInvoiceNoAsync();

        var totalAmount = dto.BillingItems.Sum(i => i.UnitPrice * i.Quantity);
        var remainingAmount = totalAmount - dto.DiscountAmount - dto.PaidAmount;

        var status = remainingAmount <= 0 ? BillingStatus.Paid :
                     dto.PaidAmount > 0 ? BillingStatus.PartialPaid : BillingStatus.Unpaid;

        var record = new BillingRecord
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            TreatmentPlanId = dto.TreatmentPlanId,
            InvoiceNo = invoiceNo,
            BillingDate = DateTime.Now,
            TotalAmount = totalAmount,
            DiscountAmount = dto.DiscountAmount,
            PaidAmount = dto.PaidAmount,
            RemainingAmount = remainingAmount,
            Status = status,
            PaymentMethod = dto.PaymentMethod,
            Remarks = dto.Remarks,
            Cashier = dto.Cashier,
            CreatedAt = DateTime.Now
        };

        foreach (var item in dto.BillingItems)
        {
            record.BillingItems.Add(new BillingItem
            {
                ItemName = item.ItemName,
                Description = item.Description,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                Subtotal = item.UnitPrice * item.Quantity
            });
        }

        _context.BillingRecords.Add(record);
        await _context.SaveChangesAsync();

        return new BillingRecordDto
        {
            Id = record.Id,
            PatientId = record.PatientId,
            PatientName = patient?.Name ?? "",
            AppointmentId = record.AppointmentId,
            TreatmentPlanId = record.TreatmentPlanId,
            InvoiceNo = record.InvoiceNo,
            BillingDate = record.BillingDate,
            TotalAmount = record.TotalAmount,
            DiscountAmount = record.DiscountAmount,
            PaidAmount = record.PaidAmount,
            RemainingAmount = record.RemainingAmount,
            Status = record.Status,
            PaymentMethod = record.PaymentMethod,
            Remarks = record.Remarks,
            Cashier = record.Cashier,
            CreatedAt = record.CreatedAt,
            BillingItems = record.BillingItems
                .Select(i => new BillingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Description = i.Description,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
        };
    }

    public async Task<BillingRecordDto?> UpdateBillingRecordAsync(int id, UpdateBillingRecordDto dto)
    {
        var record = await _context.BillingRecords
            .Include(b => b.Patient)
            .Include(b => b.BillingItems)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (record == null) return null;

        if (dto.Status.HasValue) record.Status = dto.Status.Value;
        if (dto.DiscountAmount.HasValue)
        {
            record.DiscountAmount = dto.DiscountAmount.Value;
            record.RemainingAmount = record.TotalAmount - record.DiscountAmount - record.PaidAmount;
        }
        if (dto.PaidAmount.HasValue)
        {
            record.PaidAmount = dto.PaidAmount.Value;
            record.RemainingAmount = record.TotalAmount - record.DiscountAmount - record.PaidAmount;
        }
        if (dto.PaymentMethod != null) record.PaymentMethod = dto.PaymentMethod;
        if (dto.Remarks != null) record.Remarks = dto.Remarks;
        if (dto.Cashier != null) record.Cashier = dto.Cashier;

        record.UpdatedAt = DateTime.Now;

        if (record.RemainingAmount <= 0 && record.Status != BillingStatus.Refunded)
        {
            record.Status = BillingStatus.Paid;
        }
        else if (record.PaidAmount > 0 && record.RemainingAmount > 0)
        {
            record.Status = BillingStatus.PartialPaid;
        }

        await _context.SaveChangesAsync();

        return new BillingRecordDto
        {
            Id = record.Id,
            PatientId = record.PatientId,
            PatientName = record.Patient?.Name ?? "",
            AppointmentId = record.AppointmentId,
            TreatmentPlanId = record.TreatmentPlanId,
            InvoiceNo = record.InvoiceNo,
            BillingDate = record.BillingDate,
            TotalAmount = record.TotalAmount,
            DiscountAmount = record.DiscountAmount,
            PaidAmount = record.PaidAmount,
            RemainingAmount = record.RemainingAmount,
            Status = record.Status,
            PaymentMethod = record.PaymentMethod,
            Remarks = record.Remarks,
            Cashier = record.Cashier,
            CreatedAt = record.CreatedAt,
            BillingItems = record.BillingItems
                .Select(i => new BillingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Description = i.Description,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
        };
    }

    public async Task<bool> DeleteBillingRecordAsync(int id)
    {
        var record = await _context.BillingRecords.FindAsync(id);
        if (record == null) return false;

        _context.BillingRecords.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.BillingRecords
            .Where(b => b.Status == BillingStatus.Paid || b.Status == BillingStatus.PartialPaid)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(b => b.BillingDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.BillingDate <= endDate.Value);

        return await query.SumAsync(b => b.PaidAmount);
    }

    public async Task<int> GetBillingRecordCountAsync(
        int? patientId = null,
        BillingStatus? status = null,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        var query = _context.BillingRecords.AsQueryable();

        if (patientId.HasValue)
            query = query.Where(b => b.PatientId == patientId.Value);

        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);

        if (startDate.HasValue)
            query = query.Where(b => b.BillingDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.BillingDate <= endDate.Value);

        return await query.CountAsync();
    }

    private async Task<string> GenerateInvoiceNoAsync()
    {
        var today = DateTime.Now;
        var prefix = $"INV{today:yyyyMMdd}";
        var lastRecord = await _context.BillingRecords
            .Where(b => b.InvoiceNo.StartsWith(prefix))
            .OrderByDescending(b => b.InvoiceNo)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastRecord != null)
        {
            var seqStr = lastRecord.InvoiceNo.Substring(prefix.Length);
            if (int.TryParse(seqStr, out var seq))
            {
                sequence = seq + 1;
            }
        }

        return $"{prefix}{sequence:D4}";
    }
}
