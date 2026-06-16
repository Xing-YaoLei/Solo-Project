using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Enums;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Services;

public class SettlementBillService : ISettlementBillService
{
    private readonly AppDbContext _context;

    public SettlementBillService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<SettlementBillDto>> GetBillListAsync(BillListQueryDto query)
    {
        var queryable = _context.SettlementBills
            .Include(b => b.Patient)
            .Include(b => b.SourceChannel)
            .Include(b => b.Assignee)
            .Include(b => b.ReviewTags).ThenInclude(bt => bt.ReviewTag)
            .AsQueryable();

        if (query.StatusId.HasValue)
            queryable = queryable.Where(b => b.StatusId == query.StatusId.Value);

        if (query.AssigneeId.HasValue)
            queryable = queryable.Where(b => b.AssigneeId == query.AssigneeId.Value);

        if (query.SourceChannelId.HasValue)
            queryable = queryable.Where(b => b.SourceChannelId == query.SourceChannelId.Value);

        if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            queryable = queryable.Where(b => 
                b.BillNo.Contains(query.SearchKeyword) ||
                b.Patient.Name.Contains(query.SearchKeyword) ||
                b.Patient.PatientNo.Contains(query.SearchKeyword));

        if (query.StartDate.HasValue)
            queryable = queryable.Where(b => b.CreatedAt >= query.StartDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (query.EndDate.HasValue)
            queryable = queryable.Where(b => b.CreatedAt <= query.EndDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderByDescending(b => b.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => MapToDto(b))
            .ToListAsync();

        return new PagedResultDto<SettlementBillDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<SettlementBillDto?> GetBillByIdAsync(int id)
    {
        var bill = await _context.SettlementBills
            .Include(b => b.Patient)
            .Include(b => b.SourceChannel)
            .Include(b => b.Assignee)
            .Include(b => b.Items)
            .Include(b => b.ReviewTags).ThenInclude(bt => bt.ReviewTag)
            .FirstOrDefaultAsync(b => b.Id == id);

        return bill == null ? null : MapToDto(b);
    }

    public async Task<SettlementBillDetailDto?> GetBillDetailAsync(int id)
    {
        var bill = await _context.SettlementBills
            .Include(b => b.Patient)
            .Include(b => b.SourceChannel)
            .Include(b => b.Assignee)
            .Include(b => b.Items)
            .Include(b => b.TreatmentCalendars.OrderBy(t => t.TreatmentDate))
            .Include(b => b.NursingLogs.OrderByDescending(n => n.LogDate).ThenByDescending(n => n.LogTime))
            .Include(b => b.DeviceUsageRecords).ThenInclude(d => d.Device)
            .Include(b => b.StatusTransitions.OrderBy(s => s.CreatedAt))
            .Include(b => b.ExceptionRecords).ThenInclude(e => e.SupplementMaterials)
            .Include(b => b.ReviewTags).ThenInclude(bt => bt.ReviewTag)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null) return null;

        return new SettlementBillDetailDto
        {
            Bill = MapToDto(b),
            TreatmentCalendars = bill.TreatmentCalendars.Select(t => new TreatmentCalendarDto
            {
                Id = t.Id,
                BillId = t.BillId,
                PatientId = t.PatientId,
                PatientName = bill.Patient?.Name ?? "",
                TreatmentDate = t.TreatmentDate,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                TreatmentType = t.TreatmentType,
                TreatmentItem = t.TreatmentItem,
                DoctorId = t.DoctorId,
                TherapistId = t.TherapistId,
                StatusId = t.StatusId,
                Duration = t.Duration,
                Remark = t.Remark,
                CreatedAt = t.CreatedAt
            }).ToList(),
            NursingLogs = bill.NursingLogs.Select(n => new NursingLogDto
            {
                Id = n.Id,
                BillId = n.BillId,
                PatientId = n.PatientId,
                PatientName = bill.Patient?.Name ?? "",
                TreatmentCalendarId = n.TreatmentCalendarId,
                LogDate = n.LogDate,
                LogTime = n.LogTime,
                NurseId = n.NurseId,
                VitalSigns = n.VitalSigns,
                NursingContent = n.NursingContent,
                PatientCondition = n.PatientCondition,
                Remark = n.Remark,
                CreatedAt = n.CreatedAt
            }).ToList(),
            DeviceUsageRecords = bill.DeviceUsageRecords.Select(d => new DeviceUsageRecordDto
            {
                Id = d.Id,
                DeviceId = d.DeviceId,
                DeviceName = d.Device?.DeviceName ?? "",
                BillId = d.BillId,
                TreatmentCalendarId = d.TreatmentCalendarId,
                UseDate = d.UseDate,
                StartTime = d.StartTime,
                EndTime = d.EndTime,
                Duration = d.Duration,
                Remark = d.Remark
            }).ToList(),
            StatusTransitions = bill.StatusTransitions.Select(s => new StatusTransitionDto
            {
                Id = s.Id,
                BillId = s.BillId,
                FromStatusId = s.FromStatusId,
                ToStatusId = s.ToStatusId,
                Remark = s.Remark,
                OperatorName = "",
                CreatedAt = s.CreatedAt
            }).ToList(),
            ExceptionRecords = bill.ExceptionRecords.Select(e => new ExceptionRecordDto
            {
                Id = e.Id,
                BillId = e.BillId,
                BillNo = bill.BillNo,
                ExceptionType = e.ExceptionType,
                RejectionReasonId = e.RejectionReasonId,
                Description = e.Description,
                HandlerId = e.HandlerId,
                HandleMethod = e.HandleMethod,
                HandleRemark = e.HandleRemark,
                HandledAt = e.HandledAt,
                EscalatedAt = e.EscalatedAt,
                EscalatedTo = e.EscalatedTo,
                IsClosed = e.IsClosed,
                ClosedAt = e.ClosedAt,
                CreatedAt = e.CreatedAt,
                SupplementMaterials = e.SupplementMaterials.Select(m => new SupplementMaterialDto
                {
                    Id = m.Id,
                    ExceptionRecordId = m.ExceptionRecordId,
                    BillId = m.BillId,
                    MaterialName = m.MaterialName,
                    MaterialType = m.MaterialType,
                    FileUrl = m.FileUrl,
                    Remark = m.Remark,
                    CreatedAt = m.CreatedAt
                }).ToList()
            }).ToList()
        };
    }

    public async Task<SettlementBillDto> CreateBillAsync(CreateSettlementBillDto dto, int? userId = null)
    {
        var billNo = $"JB{DateTime.Now:yyyyMMdd}{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var bill = new SettlementBill
        {
            BillNo = billNo,
            PatientId = dto.PatientId,
            StatusId = (int)SettlementStatus.PendingEntry,
            SourceChannelId = dto.SourceChannelId,
            AssigneeId = dto.AssigneeId,
            TreatmentStartDate = dto.TreatmentStartDate,
            TreatmentEndDate = dto.TreatmentEndDate,
            Remark = dto.Remark,
            CreatedById = userId,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        decimal totalAmount = 0;
        decimal insuranceAmount = 0;
        decimal selfPayAmount = 0;

        foreach (var itemDto in dto.Items)
        {
            var totalPrice = itemDto.Quantity * itemDto.UnitPrice;
            var coverage = itemDto.InsuranceCoverage ?? 0;
            var insAmount = totalPrice * coverage / 100;
            var selfAmount = totalPrice - insAmount;

            bill.Items.Add(new SettlementItem
            {
                ItemCode = itemDto.ItemCode,
                ItemName = itemDto.ItemName,
                ItemType = itemDto.ItemType,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                TotalPrice = totalPrice,
                InsuranceCoverage = coverage,
                InsuranceAmount = insAmount,
                SelfPayAmount = selfAmount,
                Remark = itemDto.Remark,
                SortOrder = itemDto.SortOrder
            });

            totalAmount += totalPrice;
            insuranceAmount += insAmount;
            selfPayAmount += selfAmount;
        }

        bill.TotalAmount = totalAmount;
        bill.InsuranceAmount = insuranceAmount;
        bill.SelfPayAmount = selfPayAmount;

        _context.SettlementBills.Add(bill);
        await _context.SaveChangesAsync();

        await AddStatusTransition(bill.Id, null, bill.StatusId, userId, "创建单据");

        return await GetBillByIdAsync(bill.Id) ?? MapToDto(bill);
    }

    public async Task<SettlementBillDto?> UpdateBillAsync(int id, UpdateSettlementBillDto dto)
    {
        var bill = await _context.SettlementBills
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null) return null;

        bill.SourceChannelId = dto.SourceChannelId ?? bill.SourceChannelId;
        bill.AssigneeId = dto.AssigneeId ?? bill.AssigneeId;
        bill.TreatmentStartDate = dto.TreatmentStartDate ?? bill.TreatmentStartDate;
        bill.TreatmentEndDate = dto.TreatmentEndDate ?? bill.TreatmentEndDate;
        bill.Remark = dto.Remark ?? bill.Remark;
        bill.UpdatedAt = DateTime.Now;

        if (dto.Items != null)
        {
            _context.SettlementItems.RemoveRange(bill.Items);
            bill.Items.Clear();

            decimal totalAmount = 0;
            decimal insuranceAmount = 0;
            decimal selfPayAmount = 0;

            foreach (var itemDto in dto.Items)
            {
                var totalPrice = itemDto.Quantity * itemDto.UnitPrice;
                var coverage = itemDto.InsuranceCoverage ?? 0;
                var insAmount = totalPrice * coverage / 100;
                var selfAmount = totalPrice - insAmount;

                bill.Items.Add(new SettlementItem
                {
                    ItemCode = itemDto.ItemCode,
                    ItemName = itemDto.ItemName,
                    ItemType = itemDto.ItemType,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    TotalPrice = totalPrice,
                    InsuranceCoverage = coverage,
                    InsuranceAmount = insAmount,
                    SelfPayAmount = selfAmount,
                    Remark = itemDto.Remark,
                    SortOrder = itemDto.SortOrder
                });

                totalAmount += totalPrice;
                insuranceAmount += insAmount;
                selfPayAmount += selfAmount;
            }

            bill.TotalAmount = totalAmount;
            bill.InsuranceAmount = insuranceAmount;
            bill.SelfPayAmount = selfPayAmount;
        }

        await _context.SaveChangesAsync();
        return await GetBillByIdAsync(id);
    }

    public async Task<bool> DeleteBillAsync(int id)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return false;

        _context.SettlementBills.Remove(bill);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SettlementBillDto?> SubmitBillAsync(int id, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        var fromStatus = bill.StatusId;
        bill.StatusId = (int)SettlementStatus.PendingReview;
        bill.SubmittedAt = DateTime.Now;
        bill.UpdatedAt = DateTime.Now;

        await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, userId, "提交审核");
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(id);
    }

    public async Task<SettlementBillDto?> ReviewBillAsync(int id, bool approved, string? remark, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        var fromStatus = bill.StatusId;
        
        if (approved)
        {
            bill.StatusId = (int)SettlementStatus.ReviewApproved;
            bill.ReviewedAt = DateTime.Now;
            bill.ReviewedById = userId;
        }
        else
        {
            bill.StatusId = (int)SettlementStatus.ReviewRejected;
            bill.ReviewedAt = DateTime.Now;
            bill.ReviewedById = userId;
            bill.RejectionRemark = remark;
        }
        
        bill.UpdatedAt = DateTime.Now;

        await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, userId, 
            approved ? "审核通过" : $"审核驳回：{remark}");
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(id);
    }

    public async Task<SettlementBillDto?> ProcessBillAsync(int id, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        var fromStatus = bill.StatusId;
        var transitionRemark = string.Empty;

        if (bill.StatusId == (int)SettlementStatus.ReviewApproved ||
            bill.StatusId == (int)SettlementStatus.ReviewRejected)
        {
            bill.StatusId = (int)SettlementStatus.Processing;
            bill.ProcessedAt = DateTime.Now;
            bill.ProcessedById = userId;
            transitionRemark = "开始处理";
        }
        else if (bill.StatusId == (int)SettlementStatus.Processing)
        {
            bill.StatusId = (int)SettlementStatus.PendingFinalReview;
            bill.ProcessedAt = DateTime.Now;
            bill.ProcessedById = userId;
            transitionRemark = "处理完成，待复盘";
        }
        else
        {
            return null;
        }

        bill.UpdatedAt = DateTime.Now;

        await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, userId, transitionRemark);
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(id);
    }

    public async Task<SettlementBillDto?> FinalReviewBillAsync(int id, bool approved, string? remark, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        var fromStatus = bill.StatusId;
        
        if (approved)
        {
            bill.StatusId = (int)SettlementStatus.Completed;
            bill.ReviewedFinalAt = DateTime.Now;
            bill.ReviewedFinalById = userId;
        }
        else
        {
            bill.StatusId = (int)SettlementStatus.Processing;
            bill.ReviewedFinalAt = DateTime.Now;
            bill.ReviewedFinalById = userId;
        }
        
        bill.UpdatedAt = DateTime.Now;

        await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, userId, 
            approved ? "复盘通过" : $"复盘驳回：{remark}");
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(id);
    }

    public async Task<SettlementBillDto?> CloseBillAsync(int id, string? remark, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        var fromStatus = bill.StatusId;
        bill.StatusId = (int)SettlementStatus.Closed;
        bill.ClosedAt = DateTime.Now;
        bill.ClosedById = userId;
        bill.UpdatedAt = DateTime.Now;

        await AddStatusTransition(bill.Id, fromStatus, bill.StatusId, userId, $"关闭单据：{remark}");
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(id);
    }

    public async Task<SettlementBillDto?> AssignBillAsync(int id, int assigneeId, int? userId = null)
    {
        var bill = await _context.SettlementBills.FindAsync(id);
        if (bill == null) return null;

        bill.AssigneeId = assigneeId;
        bill.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return await GetBillByIdAsync(id);
    }

    public async Task AddReviewTagsAsync(int billId, List<int> tagIds, int? userId = null)
    {
        var bill = await _context.SettlementBills
            .Include(b => b.ReviewTags)
            .FirstOrDefaultAsync(b => b.Id == billId);

        if (bill == null) return;

        foreach (var tagId in tagIds)
        {
            if (!bill.ReviewTags.Any(rt => rt.ReviewTagId == tagId))
            {
                bill.ReviewTags.Add(new BillReviewTag
                {
                    ReviewTagId = tagId,
                    TaggedById = userId,
                    TaggedAt = DateTime.Now
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task RemoveReviewTagAsync(int billId, int tagId)
    {
        var tag = await _context.BillReviewTags
            .FirstOrDefaultAsync(bt => bt.BillId == billId && bt.ReviewTagId == tagId);

        if (tag != null)
        {
            _context.BillReviewTags.Remove(tag);
            await _context.SaveChangesAsync();
        }
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

    private static SettlementBillDto MapToDto(SettlementBill bill)
    {
        return new SettlementBillDto
        {
            Id = bill.Id,
            BillNo = bill.BillNo,
            PatientId = bill.PatientId,
            PatientName = bill.Patient?.Name ?? "",
            PatientNo = bill.Patient?.PatientNo,
            StatusId = bill.StatusId,
            StatusName = GetStatusName(bill.StatusId),
            SourceChannelId = bill.SourceChannelId,
            SourceChannelName = bill.SourceChannel?.Name,
            AssigneeId = bill.AssigneeId,
            AssigneeName = bill.Assignee?.RealName,
            TreatmentStartDate = bill.TreatmentStartDate,
            TreatmentEndDate = bill.TreatmentEndDate,
            TotalAmount = bill.TotalAmount,
            InsuranceAmount = bill.InsuranceAmount,
            SelfPayAmount = bill.SelfPayAmount,
            RejectionRemark = bill.RejectionRemark,
            Remark = bill.Remark,
            CreatedAt = bill.CreatedAt,
            UpdatedAt = bill.UpdatedAt,
            SubmittedAt = bill.SubmittedAt,
            ReviewedAt = bill.ReviewedAt,
            ProcessedAt = bill.ProcessedAt,
            Items = bill.Items?.Select(i => new SettlementItemDto
            {
                Id = i.Id,
                BillId = i.BillId,
                ItemCode = i.ItemCode,
                ItemName = i.ItemName,
                ItemType = i.ItemType,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice,
                InsuranceCoverage = i.InsuranceCoverage,
                InsuranceAmount = i.InsuranceAmount,
                SelfPayAmount = i.SelfPayAmount,
                Remark = i.Remark,
                SortOrder = i.SortOrder
            }).ToList() ?? new List<SettlementItemDto>(),
            ReviewTags = bill.ReviewTags?.Select(rt => rt.ReviewTag?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList()
        };
    }

    private static string GetStatusName(int statusId)
    {
        return statusId switch
        {
            1 => "待录入",
            2 => "待审核",
            3 => "审核通过",
            4 => "审核驳回",
            5 => "处理中",
            6 => "待复盘",
            7 => "已完成",
            8 => "已关闭",
            9 => "医保拒付",
            10 => "补充材料中",
            11 => "升级处理",
            _ => "未知"
        };
    }
}

public class SettlementBillDetailDto
{
    public SettlementBillDto Bill { get; set; } = new();
    public List<TreatmentCalendarDto> TreatmentCalendars { get; set; } = new();
    public List<NursingLogDto> NursingLogs { get; set; } = new();
    public List<DeviceUsageRecordDto> DeviceUsageRecords { get; set; } = new();
    public List<StatusTransitionDto> StatusTransitions { get; set; } = new();
    public List<ExceptionRecordDto> ExceptionRecords { get; set; } = new();
}

public class StatusTransitionDto
{
    public int Id { get; set; }
    public int BillId { get; set; }
    public int? FromStatusId { get; set; }
    public int ToStatusId { get; set; }
    public string? Remark { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
