using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class InsuranceRecordService : IInsuranceRecordService
{
    private readonly AppDbContext _context;

    public InsuranceRecordService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<PagedResult<InsuranceRecordDto>>> GetPagedListAsync(InsuranceRecordQueryDto query)
    {
        var queryable = _context.InsuranceRecords
            .Include(i => i.Store)
            .Include(i => i.Prescription)
            .AsQueryable();

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(i => i.StoreId == query.StoreId.Value);
        }

        if (!string.IsNullOrEmpty(query.Status))
        {
            queryable = queryable.Where(i => i.Status == query.Status);
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(i => i.TradeDate >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(i => i.TradeDate <= query.EndDate.Value);
        }

        if (query.PrescriptionId.HasValue)
        {
            queryable = queryable.Where(i => i.PrescriptionId == query.PrescriptionId.Value);
        }

        if (!string.IsNullOrEmpty(query.PatientName))
        {
            queryable = queryable.Where(i => i.PatientName.Contains(query.PatientName));
        }

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            queryable = queryable.Where(i => i.RecordNo.Contains(query.Keyword) || i.PatientName.Contains(query.Keyword));
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(i => i.TradeDate)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(i => new InsuranceRecordDto
            {
                Id = i.Id,
                RecordNo = i.RecordNo,
                StoreId = i.StoreId,
                StoreName = i.Store != null ? i.Store.Name : null,
                PrescriptionId = i.PrescriptionId,
                PrescriptionNo = i.Prescription != null ? i.Prescription.PrescriptionNo : null,
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
            })
            .ToListAsync();

        return ApiResult<PagedResult<InsuranceRecordDto>>.Ok(new PagedResult<InsuranceRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<InsuranceRecordDto>> GetByIdAsync(int id)
    {
        var record = await _context.InsuranceRecords
            .Include(i => i.Store)
            .Include(i => i.Prescription)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (record == null)
        {
            return ApiResult<InsuranceRecordDto>.Fail("医保记录不存在");
        }

        var dto = new InsuranceRecordDto
        {
            Id = record.Id,
            RecordNo = record.RecordNo,
            StoreId = record.StoreId,
            StoreName = record.Store?.Name,
            PrescriptionId = record.PrescriptionId,
            PrescriptionNo = record.Prescription?.PrescriptionNo,
            PatientName = record.PatientName,
            IdCard = record.IdCard,
            InsuranceCardNo = record.InsuranceCardNo,
            TradeDate = record.TradeDate,
            TotalAmount = record.TotalAmount,
            InsurancePay = record.InsurancePay,
            SelfPay = record.SelfPay,
            TradeType = record.TradeType,
            Status = record.Status,
            Remark = record.Remark,
            CreatedAt = record.CreatedAt
        };

        return ApiResult<InsuranceRecordDto>.Ok(dto);
    }
}
