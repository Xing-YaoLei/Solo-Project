using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Enums;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Services;

public interface IExceptionService
{
    Task<List<ExceptionRecordDto>> GetExceptionRecordsAsync(int? billId = null, bool? isClosed = null);
    Task<ExceptionRecordDto?> GetExceptionRecordByIdAsync(int id);
    Task<ExceptionRecordDto> CreateExceptionRecordAsync(CreateExceptionRecordDto dto);
    Task<ExceptionRecordDto?> HandleExceptionAsync(HandleExceptionDto dto);
    Task<ExceptionRecordDto?> CloseExceptionAsync(CloseExceptionDto dto);
    Task<SupplementMaterialDto> AddSupplementMaterialAsync(CreateSupplementMaterialDto dto, int exceptionRecordId, int billId);
    Task<bool> CheckAndEscalateOverdueAsync();
}

public class ExceptionService : IExceptionService
{
    private readonly AppDbContext _context;

    public ExceptionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExceptionRecordDto>> GetExceptionRecordsAsync(int? billId = null, bool? isClosed = null)
    {
        var query = _context.ExceptionRecords
            .Include(e => e.Bill)
            .Include(e => e.RejectionReason)
            .Include(e => e.Handler)
            .Include(e => e.EscalatedToUser)
            .Include(e => e.SupplementMaterials)
            .AsQueryable();

        if (billId.HasValue)
            query = query.Where(e => e.BillId == billId.Value);

        if (isClosed.HasValue)
            query = query.Where(e => e.IsClosed == isClosed.Value);

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => MapToDto(e))
            .ToListAsync();
    }

    public async Task<ExceptionRecordDto?> GetExceptionRecordByIdAsync(int id)
    {
        var record = await _context.ExceptionRecords
            .Include(e => e.Bill)
            .Include(e => e.RejectionReason)
            .Include(e => e.Handler)
            .Include(e => e.EscalatedToUser)
            .Include(e => e.SupplementMaterials)
            .FirstOrDefaultAsync(e => e.Id == id);

        return record == null ? null : MapToDto(record);
    }

    public async Task<ExceptionRecordDto> CreateExceptionRecordAsync(CreateExceptionRecordDto dto)
    {
        var record = new ExceptionRecord
        {
            BillId = dto.BillId,
            ExceptionType = dto.ExceptionType,
            RejectionReasonId = dto.RejectionReasonId,
            Description = dto.Description,
            HandlerId = dto.HandlerId,
            IsClosed = false,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.ExceptionRecords.Add(record);

        var bill = await _context.SettlementBills.FindAsync(dto.BillId);
        if (bill != null)
        {
            var fromStatus = bill.StatusId;
            bill.StatusId = (int)SettlementStatus.InsuranceRejected;
            bill.RejectionReasonId = dto.RejectionReasonId;
            bill.UpdatedAt = DateTime.Now;

            await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, dto.HandlerId, 
                $"医保拒付：{dto.Description}");
        }

        await _context.SaveChangesAsync();
        return await GetExceptionRecordByIdAsync(record.Id) ?? MapToDto(record);
    }

    public async Task<ExceptionRecordDto?> HandleExceptionAsync(HandleExceptionDto dto)
    {
        var record = await _context.ExceptionRecords
            .Include(e => e.Bill)
            .FirstOrDefaultAsync(e => e.Id == dto.ExceptionRecordId);

        if (record == null) return null;

        record.HandlerId = dto.HandlerId ?? record.HandlerId;
        record.HandleMethod = dto.HandleMethod;
        record.HandleRemark = dto.HandleRemark;
        record.HandledAt = DateTime.Now;
        record.UpdatedAt = DateTime.Now;

        if (record.Bill != null)
        {
            var fromStatus = record.Bill.StatusId;
            int toStatus;

            switch (dto.HandleMethod)
            {
                case "CloseNormally":
                    toStatus = (int)SettlementStatus.Closed;
                    record.IsClosed = true;
                    record.ClosedAt = DateTime.Now;
                    record.ClosedById = dto.HandlerId;
                    record.Bill.StatusId = toStatus;
                    record.Bill.ClosedAt = DateTime.Now;
                    record.Bill.ClosedById = dto.HandlerId;
                    await AddStatusTransition(record.BillId, fromStatus, toStatus, dto.HandlerId, 
                        $"正常关闭：{dto.HandleRemark}");
                    break;

                case "SupplementMaterials":
                    toStatus = (int)SettlementStatus.SupplementingMaterials;
                    record.Bill.StatusId = toStatus;
                    await AddStatusTransition(record.BillId, fromStatus, toStatus, dto.HandlerId, 
                        $"补充材料：{dto.HandleRemark}");

                    if (dto.SupplementMaterials != null)
                    {
                        foreach (var mat in dto.SupplementMaterials)
                        {
                            record.SupplementMaterials.Add(new SupplementMaterial
                            {
                                BillId = record.BillId,
                                MaterialName = mat.MaterialName,
                                MaterialType = mat.MaterialType,
                                FileUrl = mat.FileUrl,
                                Remark = mat.Remark,
                                UploadedById = mat.UploadedById,
                                CreatedAt = DateTime.Now
                            });
                        }
                    }
                    break;

                case "Escalate":
                    toStatus = (int)SettlementStatus.Escalated;
                    record.Bill.StatusId = toStatus;
                    record.EscalatedAt = DateTime.Now;
                    record.EscalatedTo = dto.EscalatedTo;
                    await AddStatusTransition(record.BillId, fromStatus, toStatus, dto.HandlerId, 
                        $"升级处理：{dto.HandleRemark}");
                    break;

                default:
                    break;
            }

            record.Bill.UpdatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return await GetExceptionRecordByIdAsync(record.Id);
    }

    public async Task<ExceptionRecordDto?> CloseExceptionAsync(CloseExceptionDto dto)
    {
        var record = await _context.ExceptionRecords
            .Include(e => e.Bill)
            .FirstOrDefaultAsync(e => e.Id == dto.ExceptionRecordId);

        if (record == null) return null;

        record.IsClosed = true;
        record.ClosedAt = DateTime.Now;
        record.ClosedById = dto.ClosedById;
        record.UpdatedAt = DateTime.Now;

        if (record.Bill != null)
        {
            var fromStatus = record.Bill.StatusId;
            record.Bill.StatusId = (int)SettlementStatus.Closed;
            record.Bill.ClosedAt = DateTime.Now;
            record.Bill.ClosedById = dto.ClosedById;
            record.Bill.UpdatedAt = DateTime.Now;

            await AddStatusTransition(record.BillId, fromStatus, (int)SettlementStatus.Closed, 
                dto.ClosedById, $"异常关闭：{dto.CloseRemark}");
        }

        await _context.SaveChangesAsync();
        return await GetExceptionRecordByIdAsync(record.Id);
    }

    public async Task<SupplementMaterialDto> AddSupplementMaterialAsync(CreateSupplementMaterialDto dto, int exceptionRecordId, int billId)
    {
        var material = new SupplementMaterial
        {
            ExceptionRecordId = exceptionRecordId,
            BillId = billId,
            MaterialName = dto.MaterialName,
            MaterialType = dto.MaterialType,
            FileUrl = dto.FileUrl,
            Remark = dto.Remark,
            UploadedById = dto.UploadedById,
            CreatedAt = DateTime.Now
        };

        _context.SupplementMaterials.Add(material);
        await _context.SaveChangesAsync();

        return new SupplementMaterialDto
        {
            Id = material.Id,
            ExceptionRecordId = material.ExceptionRecordId,
            BillId = material.BillId,
            MaterialName = material.MaterialName,
            MaterialType = material.MaterialType,
            FileUrl = material.FileUrl,
            Remark = material.Remark,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<bool> CheckAndEscalateOverdueAsync()
    {
        var threshold = DateTime.Now.AddDays(-7);
        var overdueRecords = await _context.ExceptionRecords
            .Include(e => e.Bill)
            .Where(e => !e.IsClosed 
                && e.ExceptionType == "InsuranceRejection" 
                && e.CreatedAt < threshold
                && e.HandleMethod != "Escalate")
            .ToListAsync();

        foreach (var record in overdueRecords)
        {
            if (record.Bill != null)
            {
                var fromStatus = record.Bill.StatusId;
                record.Bill.StatusId = (int)SettlementStatus.Escalated;
                record.Bill.UpdatedAt = DateTime.Now;

                record.HandleMethod = "Escalate";
                record.EscalatedAt = DateTime.Now;
                record.UpdatedAt = DateTime.Now;

                await AddStatusTransition(record.BillId, fromStatus, (int)SettlementStatus.Escalated, 
                    null, "系统自动升级：超时未处理");
            }
        }

        await _context.SaveChangesAsync();
        return overdueRecords.Any();
    }

    private async Task AddStatusTransition(int billId, int? fromStatus, int toStatus, int? operatorId, string? remark)
    {
        var transition = new StatusTransition
        {
            BillId = billId,
            FromStatusId = fromStatus,
            ToStatusId = toStatus,
            OperatorId = operatorId,
            Remark = remark,
            CreatedAt = DateTime.Now
        };

        _context.StatusTransitions.Add(transition);
        await _context.SaveChangesAsync();
    }

    private static ExceptionRecordDto MapToDto(ExceptionRecord e)
    {
        return new ExceptionRecordDto
        {
            Id = e.Id,
            BillId = e.BillId,
            BillNo = e.Bill?.BillNo ?? "",
            ExceptionType = e.ExceptionType,
            RejectionReasonId = e.RejectionReasonId,
            RejectionReasonName = e.RejectionReason?.Name,
            Description = e.Description,
            HandlerId = e.HandlerId,
            HandlerName = e.Handler?.RealName,
            HandleMethod = e.HandleMethod,
            HandleRemark = e.HandleRemark,
            HandledAt = e.HandledAt,
            EscalatedAt = e.EscalatedAt,
            EscalatedTo = e.EscalatedTo,
            EscalatedToName = e.EscalatedToUser?.RealName,
            IsClosed = e.IsClosed,
            ClosedAt = e.ClosedAt,
            CreatedAt = e.CreatedAt,
            SupplementMaterials = e.SupplementMaterials?.Select(m => new SupplementMaterialDto
            {
                Id = m.Id,
                ExceptionRecordId = m.ExceptionRecordId,
                BillId = m.BillId,
                MaterialName = m.MaterialName,
                MaterialType = m.MaterialType,
                FileUrl = m.FileUrl,
                Remark = m.Remark,
                CreatedAt = m.CreatedAt
            }).ToList() ?? new List<SupplementMaterialDto>()
        };
    }
}
