using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class FollowUpService : IFollowUpService
{
    private readonly AppDbContext _context;

    public FollowUpService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<FollowUpDto>> GetByPrescriptionIdAsync(int prescriptionId)
    {
        var followUp = await _context.FollowUps
            .Include(f => f.Operator)
            .FirstOrDefaultAsync(f => f.PrescriptionId == prescriptionId);

        if (followUp == null)
        {
            return ApiResult<FollowUpDto>.Ok(null!);
        }

        var dto = new FollowUpDto
        {
            Id = followUp.Id,
            PrescriptionId = followUp.PrescriptionId,
            OperatorId = followUp.OperatorId,
            OperatorName = followUp.Operator?.RealName,
            Content = followUp.Content,
            Result = followUp.Result,
            IsCompleted = followUp.IsCompleted,
            CompletedAt = followUp.CompletedAt,
            Remark = followUp.Remark,
            CreatedAt = followUp.CreatedAt
        };

        return ApiResult<FollowUpDto>.Ok(dto);
    }

    public async Task<ApiResult<FollowUpDto>> CreateAsync(int prescriptionId, FollowUpCreateDto dto, int operatorId)
    {
        var prescription = await _context.Prescriptions.FindAsync(prescriptionId);
        if (prescription == null)
        {
            return ApiResult<FollowUpDto>.Fail("处方不存在");
        }

        var existing = await _context.FollowUps.FirstOrDefaultAsync(f => f.PrescriptionId == prescriptionId);
        if (existing != null)
        {
            return ApiResult<FollowUpDto>.Fail("回访记录已存在");
        }

        var followUp = new FollowUp
        {
            PrescriptionId = prescriptionId,
            OperatorId = operatorId,
            Content = dto.Content,
            Result = dto.Result,
            IsCompleted = dto.IsCompleted,
            CompletedAt = dto.IsCompleted ? DateTime.Now : null,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now
        };

        _context.FollowUps.Add(followUp);
        await _context.SaveChangesAsync();

        return await GetByPrescriptionIdAsync(prescriptionId);
    }

    public async Task<ApiResult> UpdateAsync(int id, FollowUpUpdateDto dto, int operatorId)
    {
        var followUp = await _context.FollowUps.FindAsync(id);
        if (followUp == null)
        {
            return ApiResult.Fail("回访记录不存在");
        }

        followUp.Content = dto.Content;
        followUp.Result = dto.Result;
        followUp.IsCompleted = dto.IsCompleted;
        if (dto.IsCompleted && !followUp.CompletedAt.HasValue)
        {
            followUp.CompletedAt = DateTime.Now;
        }
        else if (!dto.IsCompleted)
        {
            followUp.CompletedAt = null;
        }
        followUp.Remark = dto.Remark;
        followUp.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return ApiResult.Ok("更新成功");
    }
}
