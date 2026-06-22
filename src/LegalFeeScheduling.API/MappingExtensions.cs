using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;

namespace LegalFeeScheduling.API;

public static class MappingExtensions
{
    public static QuoteDetailDto ToDetailDto(this Quote quote)
    {
        return new QuoteDetailDto
        {
            Id = quote.Id,
            QuoteNo = quote.QuoteNo,
            CaseName = quote.CaseName,
            ClientName = quote.ClientName,
            Channel = quote.Channel,
            Amount = quote.Amount,
            DiscountAmount = quote.DiscountAmount,
            FinalAmount = quote.FinalAmount,
            Status = quote.Status,
            CreatedAt = quote.CreatedAt,
            CreatedBy = quote.CreatedBy,
            ApprovedAt = quote.ApprovedAt,
            ApprovedBy = quote.ApprovedBy,
            CompletedAt = quote.CompletedAt,
            ClosedAt = quote.ClosedAt,
            Remarks = quote.Remarks,
            ExpectedPaymentDate = quote.ExpectedPaymentDate,
            Owner = quote.Owner,
            Items = quote.Items?.Select(i => i.ToDetailDto()).ToList() ?? new List<QuoteItemDetailDto>(),
            Payments = quote.Payments?.Select(p => p.ToDetailDto()).ToList() ?? new List<PaymentDetailDto>(),
            Reconciliations = quote.Reconciliations?.Select(r => r.ToDetailDto()).ToList() ?? new List<ReconciliationDetailDto>(),
            StatusHistories = quote.StatusHistories?.Select(s => s.ToDto()).ToList() ?? new List<StatusHistoryDto>()
        };
    }

    public static QuoteItemDetailDto ToDetailDto(this QuoteItem item)
    {
        return new QuoteItemDetailDto
        {
            Id = item.Id,
            ItemName = item.ItemName,
            Description = item.Description,
            UnitPrice = item.UnitPrice,
            Quantity = item.Quantity,
            Subtotal = item.Subtotal
        };
    }

    public static PaymentDetailDto ToDetailDto(this PaymentRecord payment)
    {
        return new PaymentDetailDto
        {
            Id = payment.Id,
            PaymentNo = payment.PaymentNo,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            BankTransactionNo = payment.BankTransactionNo,
            Payer = payment.Payer,
            Remarks = payment.Remarks,
            CreatedAt = payment.CreatedAt,
            CreatedBy = payment.CreatedBy
        };
    }

    public static ReconciliationDetailDto ToDetailDto(this ReconciliationRecord reconciliation)
    {
        return new ReconciliationDetailDto
        {
            Id = reconciliation.Id,
            ReconcileDate = reconciliation.ReconcileDate,
            ExpectedAmount = reconciliation.ExpectedAmount,
            ActualAmount = reconciliation.ActualAmount,
            Difference = reconciliation.Difference,
            Status = reconciliation.Status,
            ResolvedBy = reconciliation.ResolvedBy,
            ResolvedAt = reconciliation.ResolvedAt,
            Remarks = reconciliation.Remarks
        };
    }

    public static StatusHistoryDto ToDto(this StatusHistory history)
    {
        return new StatusHistoryDto
        {
            Id = history.Id,
            QuoteId = history.QuoteId,
            FromStatus = history.FromStatus,
            ToStatus = history.ToStatus,
            ChangedBy = history.ChangedBy ?? string.Empty,
            ChangedAt = history.ChangedAt,
            Remarks = history.Remarks
        };
    }

    public static Quote ToEntity(this QuoteCreateDto dto)
    {
        return new Quote
        {
            Id = Guid.NewGuid(),
            CaseName = dto.CaseName,
            ClientName = dto.ClientName,
            Channel = dto.Channel,
            Amount = dto.Amount,
            DiscountAmount = dto.DiscountAmount,
            FinalAmount = dto.FinalAmount,
            Remarks = dto.Remarks,
            ExpectedPaymentDate = dto.ExpectedPaymentDate,
            Owner = dto.Owner,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items?.Select(i => i.ToEntity()).ToList() ?? new List<QuoteItem>()
        };
    }

    public static QuoteItem ToEntity(this QuoteItemCreateDto dto)
    {
        return new QuoteItem
        {
            Id = Guid.NewGuid(),
            ItemName = dto.ItemName,
            Description = dto.Description,
            UnitPrice = dto.UnitPrice,
            Quantity = dto.Quantity,
            Subtotal = dto.Subtotal,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateEntity(this QuoteUpdateDto dto, Quote entity)
    {
        entity.CaseName = dto.CaseName;
        entity.ClientName = dto.ClientName;
        entity.Channel = dto.Channel;
        entity.Amount = dto.Amount;
        entity.DiscountAmount = dto.DiscountAmount;
        entity.FinalAmount = dto.FinalAmount;
        entity.Remarks = dto.Remarks;
        entity.ExpectedPaymentDate = dto.ExpectedPaymentDate;
        entity.Owner = dto.Owner;
    }

    public static PaymentRecord ToEntity(this PaymentCreateDto dto)
    {
        return new PaymentRecord
        {
            Id = Guid.NewGuid(),
            QuoteId = dto.QuoteId,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate,
            PaymentMethod = dto.PaymentMethod,
            BankTransactionNo = dto.BankTransactionNo,
            Payer = dto.Payer,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateEntity(this PaymentUpdateDto dto, PaymentRecord entity)
    {
        entity.Amount = dto.Amount;
        entity.PaymentDate = dto.PaymentDate;
        entity.PaymentMethod = dto.PaymentMethod;
        entity.Status = dto.Status;
        entity.BankTransactionNo = dto.BankTransactionNo;
        entity.Payer = dto.Payer;
        entity.Remarks = dto.Remarks;
    }

    public static ReconciliationRecord ToEntity(this ReconciliationCreateDto dto)
    {
        return new ReconciliationRecord
        {
            Id = Guid.NewGuid(),
            QuoteId = dto.QuoteId,
            ReconcileDate = dto.ReconcileDate,
            ExpectedAmount = dto.ExpectedAmount,
            ActualAmount = dto.ActualAmount,
            Difference = dto.ExpectedAmount - dto.ActualAmount,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateEntity(this ReconciliationUpdateDto dto, ReconciliationRecord entity)
    {
        entity.ReconcileDate = dto.ReconcileDate;
        entity.ExpectedAmount = dto.ExpectedAmount;
        entity.ActualAmount = dto.ActualAmount;
        entity.Difference = dto.ExpectedAmount - dto.ActualAmount;
        entity.Status = dto.Status;
        entity.Remarks = dto.Remarks;
    }

    public static PagedResultDto<T> ToPagedResult<T>(this IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        return new PagedResultDto<T>
        {
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            Page = page,
            PageSize = pageSize,
            Items = items.ToList()
        };
    }
}
