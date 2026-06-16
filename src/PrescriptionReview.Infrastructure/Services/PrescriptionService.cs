using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly AppDbContext _context;

    public PrescriptionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<PagedResult<PrescriptionDto>>> GetPagedListAsync(PrescriptionQueryDto query, int? currentUserId = null)
    {
        var queryable = _context.Prescriptions
            .Include(p => p.Store)
            .Include(p => p.Cashier)
            .Include(p => p.Pharmacist)
            .Include(p => p.Items)
            .Include(p => p.Attachments)
            .Include(p => p.FollowUp)
            .AsQueryable();

        if (currentUserId.HasValue)
        {
            var user = await _context.Users.FindAsync(currentUserId.Value);
            if (user != null && user.Role != UserRole.Headquarters)
            {
                if (user.StoreId.HasValue)
                {
                    queryable = queryable.Where(p => p.StoreId == user.StoreId.Value);
                }
                if (user.Role == UserRole.Pharmacist)
                {
                    queryable = queryable.Where(p => p.PharmacistId == user.Id || p.Status == PrescriptionStatus.Pending || p.Status == PrescriptionStatus.Reviewing);
                }
            }
        }

        if (query.Status.HasValue)
        {
            queryable = queryable.Where(p => p.Status == query.Status.Value);
        }

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(p => p.StoreId == query.StoreId.Value);
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt <= query.EndDate.Value);
        }

        if (!string.IsNullOrEmpty(query.PatientName))
        {
            queryable = queryable.Where(p => p.PatientName.Contains(query.PatientName));
        }

        if (query.HasUnclearRecord == true)
        {
            queryable = queryable.Where(p => p.AuditLogs.Any(a => a.OldStatus == PrescriptionStatus.Unclear || a.NewStatus == PrescriptionStatus.Unclear));
        }

        if (query.FollowUpCompleted == true)
        {
            queryable = queryable.Where(p => p.FollowUp != null && p.FollowUp.IsCompleted);
        }

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            queryable = queryable.Where(p => p.PrescriptionNo.Contains(query.Keyword) || p.PatientName.Contains(query.Keyword));
        }

        var totalCount = await queryable.CountAsync();

        if (!string.IsNullOrEmpty(query.SortField))
        {
            var isDesc = query.SortOrder?.ToLower() == "desc";
            queryable = query.SortField.ToLower() switch
            {
                "createdat" => isDesc ? queryable.OrderByDescending(p => p.CreatedAt) : queryable.OrderBy(p => p.CreatedAt),
                "status" => isDesc ? queryable.OrderByDescending(p => p.Status) : queryable.OrderBy(p => p.Status),
                "prescriptiondate" => isDesc ? queryable.OrderByDescending(p => p.PrescriptionDate) : queryable.OrderBy(p => p.PrescriptionDate),
                _ => queryable.OrderByDescending(p => p.CreatedAt)
            };
        }
        else
        {
            queryable = queryable.OrderByDescending(p => p.CreatedAt);
        }

        var items = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new PrescriptionDto
            {
                Id = p.Id,
                PrescriptionNo = p.PrescriptionNo,
                PatientName = p.PatientName,
                PatientPhone = p.PatientPhone,
                Age = p.Age,
                Gender = p.Gender,
                Diagnosis = p.Diagnosis,
                DoctorName = p.DoctorName,
                Hospital = p.Hospital,
                PrescriptionDate = p.PrescriptionDate,
                StoreId = p.StoreId,
                StoreName = p.Store != null ? p.Store.Name : null,
                Status = p.Status,
                StatusName = GetStatusName(p.Status),
                Remark = p.Remark,
                CashierId = p.CashierId,
                CashierName = p.Cashier != null ? p.Cashier.RealName : null,
                PharmacistId = p.PharmacistId,
                PharmacistName = p.Pharmacist != null ? p.Pharmacist.RealName : null,
                SubmittedAt = p.SubmittedAt,
                ReviewedAt = p.ReviewedAt,
                CreatedAt = p.CreatedAt,
                ItemCount = p.Items.Count,
                AttachmentCount = p.Attachments.Count,
                HasUnclearRecord = p.AuditLogs.Any(a => a.OldStatus == PrescriptionStatus.Unclear || a.NewStatus == PrescriptionStatus.Unclear)
            })
            .ToListAsync();

        return ApiResult<PagedResult<PrescriptionDto>>.Ok(new PagedResult<PrescriptionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<PrescriptionDetailDto>> GetByIdAsync(int id)
    {
        var prescription = await _context.Prescriptions
            .Include(p => p.Store)
            .Include(p => p.Cashier)
            .Include(p => p.Pharmacist)
            .Include(p => p.Items)
            .Include(p => p.Attachments).ThenInclude(a => a.Uploader)
            .Include(p => p.AuditLogs).ThenInclude(a => a.Operator)
            .Include(p => p.SupplementNotes).ThenInclude(s => s.Operator)
            .Include(p => p.PharmacistOpinions).ThenInclude(po => po.Pharmacist)
            .Include(p => p.FollowUp).ThenInclude(f => f.Operator)
            .Include(p => p.RestockOrders).ThenInclude(r => r.Operator)
            .Include(p => p.RestockOrders).ThenInclude(r => r.Items)
            .Include(p => p.InsuranceRecords)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prescription == null)
        {
            return ApiResult<PrescriptionDetailDto>.Fail("处方不存在");
        }

        var dto = MapToDetailDto(prescription);
        return ApiResult<PrescriptionDetailDto>.Ok(dto);
    }

    public async Task<ApiResult<PrescriptionDto>> CreateAsync(PrescriptionCreateDto dto, int cashierId)
    {
        var prescriptionNo = await GeneratePrescriptionNo();

        var prescription = new Prescription
        {
            PrescriptionNo = prescriptionNo,
            PatientName = dto.PatientName,
            PatientPhone = dto.PatientPhone,
            PatientIdCard = dto.PatientIdCard,
            Age = dto.Age,
            Gender = dto.Gender,
            Diagnosis = dto.Diagnosis,
            DoctorName = dto.DoctorName,
            Hospital = dto.Hospital,
            PrescriptionDate = dto.PrescriptionDate,
            StoreId = dto.StoreId,
            Status = PrescriptionStatus.Pending,
            Remark = dto.Remark,
            CashierId = cashierId,
            CreatedAt = DateTime.Now
        };

        foreach (var item in dto.Items)
        {
            prescription.Items.Add(new PrescriptionItem
            {
                DrugName = item.DrugName,
                Specification = item.Specification,
                Dosage = item.Dosage,
                Frequency = item.Frequency,
                Quantity = item.Quantity,
                Unit = item.Unit,
                Price = item.Price,
                Remark = item.Remark
            });
        }

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync();

        var result = await GetByIdAsync(prescription.Id);
        return ApiResult<PrescriptionDto>.Ok(result.Data!);
    }

    public async Task<ApiResult> UpdateAsync(int id, PrescriptionUpdateDto dto)
    {
        var prescription = await _context.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prescription == null)
        {
            return ApiResult.Fail("处方不存在");
        }

        if (prescription.Status != PrescriptionStatus.Pending)
        {
            return ApiResult.Fail("只有待提交状态的处方可以修改");
        }

        prescription.PatientName = dto.PatientName;
        prescription.PatientPhone = dto.PatientPhone;
        prescription.PatientIdCard = dto.PatientIdCard;
        prescription.Age = dto.Age;
        prescription.Gender = dto.Gender;
        prescription.Diagnosis = dto.Diagnosis;
        prescription.DoctorName = dto.DoctorName;
        prescription.Hospital = dto.Hospital;
        prescription.PrescriptionDate = dto.PrescriptionDate;
        prescription.Remark = dto.Remark;
        prescription.UpdatedAt = DateTime.Now;

        _context.PrescriptionItems.RemoveRange(prescription.Items);

        foreach (var item in dto.Items)
        {
            prescription.Items.Add(new PrescriptionItem
            {
                DrugName = item.DrugName,
                Specification = item.Specification,
                Dosage = item.Dosage,
                Frequency = item.Frequency,
                Quantity = item.Quantity,
                Unit = item.Unit,
                Price = item.Price,
                Remark = item.Remark
            });
        }

        await _context.SaveChangesAsync();
        return ApiResult.Ok();
    }

    public async Task<ApiResult> SubmitAsync(int id, int cashierId)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
        {
            return ApiResult.Fail("处方不存在");
        }

        if (prescription.Status != PrescriptionStatus.Pending)
        {
            return ApiResult.Fail("只有待提交状态的处方可以提交");
        }

        var oldStatus = prescription.Status;
        prescription.Status = PrescriptionStatus.Reviewing;
        prescription.SubmittedAt = DateTime.Now;
        prescription.UpdatedAt = DateTime.Now;

        _context.AuditLogs.Add(new AuditLog
        {
            PrescriptionId = id,
            OperatorId = cashierId,
            OldStatus = oldStatus,
            NewStatus = PrescriptionStatus.Reviewing,
            Action = "提交审核",
            Remark = "收银员提交处方审核",
            CreatedAt = DateTime.Now
        });

        await _context.SaveChangesAsync();
        return ApiResult.Ok("提交成功");
    }

    public async Task<ApiResult> ReviewAsync(int id, PrescriptionReviewDto dto, int pharmacistId)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
        {
            return ApiResult.Fail("处方不存在");
        }

        if (prescription.Status != PrescriptionStatus.Reviewing && prescription.Status != PrescriptionStatus.SupplementRequired)
        {
            return ApiResult.Fail("当前状态不能审核");
        }

        var oldStatus = prescription.Status;
        var newStatus = dto.IsApproved ? PrescriptionStatus.Approved : PrescriptionStatus.Rejected;

        prescription.Status = newStatus;
        prescription.PharmacistId = pharmacistId;
        prescription.ReviewedAt = DateTime.Now;
        prescription.UpdatedAt = DateTime.Now;

        _context.PharmacistOpinions.Add(new PharmacistOpinion
        {
            PrescriptionId = id,
            PharmacistId = pharmacistId,
            Opinion = dto.Opinion,
            IsApproved = dto.IsApproved,
            CreatedAt = DateTime.Now
        });

        _context.AuditLogs.Add(new AuditLog
        {
            PrescriptionId = id,
            OperatorId = pharmacistId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Action = dto.IsApproved ? "审核通过" : "审核拒绝",
            Remark = dto.Remark,
            CreatedAt = DateTime.Now
        });

        await _context.SaveChangesAsync();
        return ApiResult.Ok(dto.IsApproved ? "审核通过" : "已拒绝");
    }

    public async Task<ApiResult> BatchReviewAsync(PrescriptionBatchReviewDto dto, int pharmacistId)
    {
        var prescriptions = await _context.Prescriptions
            .Where(p => dto.Ids.Contains(p.Id) && (p.Status == PrescriptionStatus.Reviewing || p.Status == PrescriptionStatus.SupplementRequired))
            .ToListAsync();

        if (prescriptions.Count == 0)
        {
            return ApiResult.Fail("没有可审核的处方");
        }

        var newStatus = dto.IsApproved ? PrescriptionStatus.Approved : PrescriptionStatus.Rejected;

        foreach (var prescription in prescriptions)
        {
            var oldStatus = prescription.Status;
            prescription.Status = newStatus;
            prescription.PharmacistId = pharmacistId;
            prescription.ReviewedAt = DateTime.Now;
            prescription.UpdatedAt = DateTime.Now;

            _context.PharmacistOpinions.Add(new PharmacistOpinion
            {
                PrescriptionId = prescription.Id,
                PharmacistId = pharmacistId,
                Opinion = dto.Opinion,
                IsApproved = dto.IsApproved,
                CreatedAt = DateTime.Now
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PrescriptionId = prescription.Id,
                OperatorId = pharmacistId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Action = dto.IsApproved ? "批量审核通过" : "批量审核拒绝",
                Remark = "批量处理",
                CreatedAt = DateTime.Now
            });
        }

        await _context.SaveChangesAsync();
        return ApiResult.Ok($"批量处理完成，共处理 {prescriptions.Count} 条");
    }

    public async Task<ApiResult> ChangeStatusAsync(int id, PrescriptionStatusChangeDto dto, int operatorId)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
        {
            return ApiResult.Fail("处方不存在");
        }

        var oldStatus = prescription.Status;
        prescription.Status = dto.Status;
        prescription.UpdatedAt = DateTime.Now;

        _context.AuditLogs.Add(new AuditLog
        {
            PrescriptionId = id,
            OperatorId = operatorId,
            OldStatus = oldStatus,
            NewStatus = dto.Status,
            Action = "状态变更",
            Remark = dto.Remark,
            CreatedAt = DateTime.Now
        });

        await _context.SaveChangesAsync();
        return ApiResult.Ok("状态已更新");
    }

    public async Task<ApiResult> AddSupplementNoteAsync(int id, SupplementNoteCreateDto dto, int operatorId)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
        {
            return ApiResult.Fail("处方不存在");
        }

        _context.SupplementNotes.Add(new SupplementNote
        {
            PrescriptionId = id,
            OperatorId = operatorId,
            Content = dto.Content,
            Source = dto.Source,
            CreatedAt = DateTime.Now
        });

        if (prescription.Status == PrescriptionStatus.Unclear || prescription.Status == PrescriptionStatus.SupplementRequired)
        {
            var oldStatus = prescription.Status;
            prescription.Status = PrescriptionStatus.Reviewing;
            prescription.UpdatedAt = DateTime.Now;

            _context.AuditLogs.Add(new AuditLog
            {
                PrescriptionId = id,
                OperatorId = operatorId,
                OldStatus = oldStatus,
                NewStatus = PrescriptionStatus.Reviewing,
                Action = "补充资料",
                Remark = dto.Content,
                CreatedAt = DateTime.Now
            });
        }

        await _context.SaveChangesAsync();
        return ApiResult.Ok("补充说明已添加");
    }

    private async Task<string> GeneratePrescriptionNo()
    {
        var datePrefix = DateTime.Now.ToString("yyyyMMdd");
        var lastPrescription = await _context.Prescriptions
            .Where(p => p.PrescriptionNo.StartsWith("RX" + datePrefix))
            .OrderByDescending(p => p.PrescriptionNo)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastPrescription != null)
        {
            var seqStr = lastPrescription.PrescriptionNo.Substring(10);
            if (int.TryParse(seqStr, out var seq))
            {
                sequence = seq + 1;
            }
        }

        return $"RX{datePrefix}{sequence:D4}";
    }

    private PrescriptionDetailDto MapToDetailDto(Prescription p)
    {
        return new PrescriptionDetailDto
        {
            Id = p.Id,
            PrescriptionNo = p.PrescriptionNo,
            PatientName = p.PatientName,
            PatientPhone = p.PatientPhone,
            Age = p.Age,
            Gender = p.Gender,
            Diagnosis = p.Diagnosis,
            DoctorName = p.DoctorName,
            Hospital = p.Hospital,
            PrescriptionDate = p.PrescriptionDate,
            StoreId = p.StoreId,
            StoreName = p.Store?.Name,
            Status = p.Status,
            StatusName = GetStatusName(p.Status),
            Remark = p.Remark,
            CashierId = p.CashierId,
            CashierName = p.Cashier?.RealName,
            PharmacistId = p.PharmacistId,
            PharmacistName = p.Pharmacist?.RealName,
            SubmittedAt = p.SubmittedAt,
            ReviewedAt = p.ReviewedAt,
            CreatedAt = p.CreatedAt,
            ItemCount = p.Items.Count,
            AttachmentCount = p.Attachments.Count,
            HasUnclearRecord = p.AuditLogs.Any(a => a.OldStatus == PrescriptionStatus.Unclear || a.NewStatus == PrescriptionStatus.Unclear),
            Items = p.Items.Select(i => new PrescriptionItemDto
            {
                Id = i.Id,
                DrugName = i.DrugName,
                Specification = i.Specification,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                Quantity = i.Quantity,
                Unit = i.Unit,
                Price = i.Price,
                Remark = i.Remark
            }).ToList(),
            Attachments = p.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                Type = a.Type,
                TypeName = GetAttachmentTypeName(a.Type),
                FileName = a.FileName,
                OriginalFileName = a.OriginalFileName,
                FilePath = a.FilePath,
                FileSize = a.FileSize,
                ContentType = a.ContentType,
                UploadedBy = a.UploadedBy,
                UploaderName = a.Uploader?.RealName,
                CreatedAt = a.CreatedAt
            }).ToList(),
            AuditLogs = p.AuditLogs.OrderByDescending(a => a.CreatedAt).Select(a => new AuditLogDto
            {
                Id = a.Id,
                PrescriptionId = a.PrescriptionId,
                OperatorId = a.OperatorId,
                OperatorName = a.Operator?.RealName,
                OldStatusName = GetStatusName(a.OldStatus),
                NewStatusName = GetStatusName(a.NewStatus),
                Action = a.Action,
                Remark = a.Remark,
                CreatedAt = a.CreatedAt
            }).ToList(),
            SupplementNotes = p.SupplementNotes.OrderByDescending(s => s.CreatedAt).Select(s => new SupplementNoteDto
            {
                Id = s.Id,
                PrescriptionId = s.PrescriptionId,
                OperatorId = s.OperatorId,
                OperatorName = s.Operator?.RealName,
                Content = s.Content,
                Source = s.Source,
                CreatedAt = s.CreatedAt
            }).ToList(),
            PharmacistOpinions = p.PharmacistOpinions.OrderByDescending(o => o.CreatedAt).Select(o => new PharmacistOpinionDto
            {
                Id = o.Id,
                PrescriptionId = o.PrescriptionId,
                PharmacistId = o.PharmacistId,
                PharmacistName = o.Pharmacist?.RealName,
                Opinion = o.Opinion,
                IsApproved = o.IsApproved,
                CreatedAt = o.CreatedAt
            }).ToList(),
            FollowUp = p.FollowUp == null ? null : new FollowUpDto
            {
                Id = p.FollowUp.Id,
                PrescriptionId = p.FollowUp.PrescriptionId,
                OperatorId = p.FollowUp.OperatorId,
                OperatorName = p.FollowUp.Operator?.RealName,
                Content = p.FollowUp.Content,
                Result = p.FollowUp.Result,
                IsCompleted = p.FollowUp.IsCompleted,
                CompletedAt = p.FollowUp.CompletedAt,
                Remark = p.FollowUp.Remark,
                CreatedAt = p.FollowUp.CreatedAt
            },
            RestockOrders = p.RestockOrders.OrderByDescending(r => r.OrderDate).Select(r => new RestockOrderDto
            {
                Id = r.Id,
                OrderNo = r.OrderNo,
                StoreId = r.StoreId,
                StoreName = r.Store?.Name,
                PrescriptionId = r.PrescriptionId,
                PrescriptionNo = r.Prescription?.PrescriptionNo,
                OrderDate = r.OrderDate,
                TotalAmount = r.TotalAmount,
                ItemCount = r.ItemCount,
                Status = r.Status,
                Remark = r.Remark,
                OperatorId = r.OperatorId,
                OperatorName = r.Operator?.RealName,
                CreatedAt = r.CreatedAt
            }).ToList(),
            InsuranceRecords = p.InsuranceRecords.OrderByDescending(i => i.TradeDate).Select(i => new InsuranceRecordDto
            {
                Id = i.Id,
                RecordNo = i.RecordNo,
                StoreId = i.StoreId,
                StoreName = i.Store?.Name,
                PrescriptionId = i.PrescriptionId,
                PrescriptionNo = i.Prescription?.PrescriptionNo,
                PatientName = i.PatientName,
                IdCard = i.IdCard,
                InsuranceCardNo = i.InsuranceCardNo,
                TradeDate = i.TradeDate,
                TotalAmount = i.TotalAmount,
                InsurancePay = i.InsurancePay,
                SelfPay = i.SelfPay,
                TradeType = i.TradeType,
                Status = i.Status,
                Remark = i.Remark,
                CreatedAt = i.CreatedAt
            }).ToList()
        };
    }

    private string GetStatusName(PrescriptionStatus status)
    {
        return status switch
        {
            PrescriptionStatus.Pending => "待提交",
            PrescriptionStatus.Reviewing => "审核中",
            PrescriptionStatus.Approved => "审核通过",
            PrescriptionStatus.Rejected => "审核拒绝",
            PrescriptionStatus.Unclear => "处方不清",
            PrescriptionStatus.SupplementRequired => "需补充资料",
            PrescriptionStatus.Completed => "已完成",
            _ => "未知"
        };
    }

    private string GetAttachmentTypeName(AttachmentType type)
    {
        return type switch
        {
            AttachmentType.PrescriptionPhoto => "处方照片",
            AttachmentType.SupplementDocument => "补充资料",
            AttachmentType.RestockOrder => "补货单",
            AttachmentType.InsuranceRecord => "医保流水",
            AttachmentType.Other => "其他",
            _ => "未知"
        };
    }
}
