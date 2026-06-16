using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class RestockOrderService : IRestockOrderService
{
    private readonly AppDbContext _context;

    public RestockOrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<PagedResult<RestockOrderDto>>> GetPagedListAsync(RestockOrderQueryDto query)
    {
        var queryable = _context.RestockOrders
            .Include(r => r.Store)
            .Include(r => r.Operator)
            .Include(r => r.Prescription)
            .AsQueryable();

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(r => r.StoreId == query.StoreId.Value);
        }

        if (!string.IsNullOrEmpty(query.Status))
        {
            queryable = queryable.Where(r => r.Status == query.Status);
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(r => r.OrderDate >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(r => r.OrderDate <= query.EndDate.Value);
        }

        if (query.PrescriptionId.HasValue)
        {
            queryable = queryable.Where(r => r.PrescriptionId == query.PrescriptionId.Value);
        }

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            queryable = queryable.Where(r => r.OrderNo.Contains(query.Keyword));
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(r => r.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(r => new RestockOrderDto
            {
                Id = r.Id,
                OrderNo = r.OrderNo,
                StoreId = r.StoreId,
                StoreName = r.Store != null ? r.Store.Name : null,
                PrescriptionId = r.PrescriptionId,
                PrescriptionNo = r.Prescription != null ? r.Prescription.PrescriptionNo : null,
                OrderDate = r.OrderDate,
                TotalAmount = r.TotalAmount,
                ItemCount = r.ItemCount,
                Status = r.Status,
                Remark = r.Remark,
                OperatorId = r.OperatorId,
                OperatorName = r.Operator != null ? r.Operator.RealName : null,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return ApiResult<PagedResult<RestockOrderDto>>.Ok(new PagedResult<RestockOrderDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<RestockOrderDetailDto>> GetByIdAsync(int id)
    {
        var order = await _context.RestockOrders
            .Include(r => r.Store)
            .Include(r => r.Operator)
            .Include(r => r.Prescription)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (order == null)
        {
            return ApiResult<RestockOrderDetailDto>.Fail("补货单不存在");
        }

        var dto = new RestockOrderDetailDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            StoreId = order.StoreId,
            StoreName = order.Store?.Name,
            PrescriptionId = order.PrescriptionId,
            PrescriptionNo = order.Prescription?.PrescriptionNo,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            ItemCount = order.ItemCount,
            Status = order.Status,
            Remark = order.Remark,
            OperatorId = order.OperatorId,
            OperatorName = order.Operator?.RealName,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new RestockOrderItemDto
            {
                Id = i.Id,
                DrugName = i.DrugName,
                Specification = i.Specification,
                Quantity = i.Quantity,
                Unit = i.Unit,
                Price = i.Price,
                Amount = i.Amount,
                BatchNo = i.BatchNo,
                ExpireDate = i.ExpireDate
            }).ToList()
        };

        return ApiResult<RestockOrderDetailDto>.Ok(dto);
    }
}
