using ClosedXML.Excel;
using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.Infrastructure.Services;

public class ExportService : IExportService
{
    private readonly AppDbContext _context;

    public ExportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportSettlementSheetAsync(int sheetId)
    {
        var sheet = await _context.SettlementSheets
            .Include(s => s.GroupBatch)
            .Include(s => s.LeaderTier)
            .Include(s => s.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(s => s.Id == sheetId);

        if (sheet == null) throw new KeyNotFoundException($"结算单 {sheetId} 不存在");

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("结算单");

        ws.Cell(1, 1).Value = "结算单号";
        ws.Cell(1, 2).Value = sheet.SheetNo;
        ws.Cell(2, 1).Value = "批次";
        ws.Cell(2, 2).Value = sheet.GroupBatch.BatchName;
        ws.Cell(3, 1).Value = "团长等级";
        ws.Cell(3, 2).Value = sheet.LeaderTier.TierName;
        ws.Cell(4, 1).Value = "总金额";
        ws.Cell(4, 2).Value = sheet.TotalAmount;
        ws.Cell(5, 1).Value = "品项数";
        ws.Cell(5, 2).Value = sheet.ItemCount;
        ws.Cell(6, 1).Value = "状态";
        ws.Cell(6, 2).Value = sheet.SettlementStatus.ToString();

        var headerRow = 8;
        ws.Cell(headerRow, 1).Value = "商品";
        ws.Cell(headerRow, 2).Value = "数量";
        ws.Cell(headerRow, 3).Value = "单价";
        ws.Cell(headerRow, 4).Value = "小计";
        ws.Cell(headerRow, 5).Value = "口径说明";

        var row = headerRow + 1;
        foreach (var item in sheet.Items)
        {
            ws.Cell(row, 1).Value = item.ProductTag.ProductName;
            ws.Cell(row, 2).Value = item.Quantity;
            ws.Cell(row, 3).Value = item.UnitPrice;
            ws.Cell(row, 4).Value = item.Subtotal;
            ws.Cell(row, 5).Value = item.CaliberNote ?? "";
            row++;
        }

        row += 1;
        ws.Cell(row, 1).Value = "口径说明";
        ws.Cell(row + 1, 1).Value = "计算口径";
        ws.Cell(row + 1, 2).Value = "金额=数量×单价, 客单价=总金额/品项数";
        ws.Cell(row + 2, 1).Value = "统计范围";
        ws.Cell(row + 2, 2).Value = "当前结算单所含商品";
        ws.Cell(row + 3, 1).Value = "数据来源";
        ws.Cell(row + 3, 2).Value = "团购批次到货清单";

        var range = ws.RangeUsed();
        if (range != null)
        {
            range.Style.Font.FontSize = 11;
            ws.Columns().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportArrivalListAsync(int listId)
    {
        var list = await _context.ArrivalLists
            .Include(a => a.GroupBatch)
            .Include(a => a.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(a => a.Id == listId);

        if (list == null) throw new KeyNotFoundException($"到货清单 {listId} 不存在");

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("到货清单");

        ws.Cell(1, 1).Value = "到货清单号";
        ws.Cell(1, 2).Value = list.ListNo;
        ws.Cell(2, 1).Value = "批次";
        ws.Cell(2, 2).Value = list.GroupBatch.BatchName;
        ws.Cell(3, 1).Value = "到货时间";
        ws.Cell(3, 2).Value = list.ArrivalTime.ToString("yyyy-MM-dd HH:mm:ss");
        ws.Cell(4, 1).Value = "签收人";
        ws.Cell(4, 2).Value = list.Receiver ?? "";
        ws.Cell(5, 1).Value = "状态";
        ws.Cell(5, 2).Value = list.ArrivalStatus.ToString();

        var headerRow = 7;
        ws.Cell(headerRow, 1).Value = "商品";
        ws.Cell(headerRow, 2).Value = "预计数量";
        ws.Cell(headerRow, 3).Value = "实际数量";
        ws.Cell(headerRow, 4).Value = "温度(℃)";
        ws.Cell(headerRow, 5).Value = "状态";
        ws.Cell(headerRow, 6).Value = "备注";

        var row = headerRow + 1;
        foreach (var item in list.Items)
        {
            ws.Cell(row, 1).Value = item.ProductTag.ProductName;
            ws.Cell(row, 2).Value = item.ExpectedQty;
            ws.Cell(row, 3).Value = item.ActualQty?.ToString() ?? "";
            ws.Cell(row, 4).Value = item.Temperature?.ToString() ?? "";
            ws.Cell(row, 5).Value = item.Condition ?? "";
            ws.Cell(row, 6).Value = item.Notes ?? "";
            row++;
        }

        row += 1;
        ws.Cell(row, 1).Value = "口径说明";
        ws.Cell(row + 1, 1).Value = "计算口径";
        ws.Cell(row + 1, 2).Value = "实际到货数量以签收人确认的实收数量为准";
        ws.Cell(row + 2, 1).Value = "统计范围";
        ws.Cell(row + 2, 2).Value = "当前到货清单所含商品明细";
        ws.Cell(row + 3, 1).Value = "数据来源";
        ws.Cell(row + 3, 2).Value = "团购批次发货单与签收记录";

        var range = ws.RangeUsed();
        if (range != null)
        {
            range.Style.Font.FontSize = 11;
            ws.Columns().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportExceptionOrdersAsync(IEnumerable<int> orderIds)
    {
        var idList = orderIds.ToList();
        var orders = await _context.ExceptionOrders
            .Include(e => e.GroupBatch)
            .Include(e => e.ArrivalList)
            .Include(e => e.ProductTag)
            .Where(e => idList.Contains(e.Id))
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("异常工单");

        var headerRow = 1;
        ws.Cell(headerRow, 1).Value = "异常单号";
        ws.Cell(headerRow, 2).Value = "团购批次";
        ws.Cell(headerRow, 3).Value = "到货清单";
        ws.Cell(headerRow, 4).Value = "商品";
        ws.Cell(headerRow, 5).Value = "客户姓名";
        ws.Cell(headerRow, 6).Value = "客户电话";
        ws.Cell(headerRow, 7).Value = "异常类型";
        ws.Cell(headerRow, 8).Value = "严重程度";
        ws.Cell(headerRow, 9).Value = "影响范围";
        ws.Cell(headerRow, 10).Value = "责任归属";
        ws.Cell(headerRow, 11).Value = "处理方式";
        ws.Cell(headerRow, 12).Value = "处理结果";
        ws.Cell(headerRow, 13).Value = "处理人";
        ws.Cell(headerRow, 14).Value = "处理时间";

        var row = headerRow + 1;
        foreach (var order in orders)
        {
            ws.Cell(row, 1).Value = order.OrderNo;
            ws.Cell(row, 2).Value = order.GroupBatch.BatchName;
            ws.Cell(row, 3).Value = order.ArrivalList?.ListNo ?? "";
            ws.Cell(row, 4).Value = order.ProductTag?.ProductName ?? "";
            ws.Cell(row, 5).Value = order.CustomerName ?? "";
            ws.Cell(row, 6).Value = order.CustomerPhone ?? "";
            ws.Cell(row, 7).Value = order.ExceptionType.ToString();
            ws.Cell(row, 8).Value = order.Severity.ToString();
            ws.Cell(row, 9).Value = order.ImpactDescription ?? "";
            ws.Cell(row, 10).Value = order.Responsibility ?? "";
            ws.Cell(row, 11).Value = order.Resolution.ToString();
            ws.Cell(row, 12).Value = order.ResolutionNotes ?? "";
            ws.Cell(row, 13).Value = order.ResolvedBy ?? "";
            ws.Cell(row, 14).Value = order.ResolvedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
            row++;
        }

        row += 1;
        ws.Cell(row, 1).Value = "口径说明";
        ws.Cell(row + 1, 1).Value = "计算口径";
        ws.Cell(row + 1, 2).Value = "异常工单按创建时间统计,处理方式包含退款/补发/丢弃/协商";
        ws.Cell(row + 2, 1).Value = "统计范围";
        ws.Cell(row + 2, 2).Value = "所选异常工单";
        ws.Cell(row + 3, 1).Value = "数据来源";
        ws.Cell(row + 3, 2).Value = "到货清单签收记录与异常上报";

        var range = ws.RangeUsed();
        if (range != null)
        {
            range.Style.Font.FontSize = 11;
            ws.Columns().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public string GetCaliberDescription(string exportType)
    {
        return exportType.ToLower() switch
        {
            "settlement" => "计算口径: 金额=数量×单价, 客单价=总金额/品项数; 统计范围: 当前结算单所含商品; 数据来源: 团购批次到货清单",
            "arrival" => "计算口径: 实际到货数量以签收人确认的实收数量为准; 统计范围: 当前到货清单所含商品明细; 数据来源: 团购批次发货单与签收记录",
            "exception" => "计算口径: 异常工单按创建时间统计,处理方式包含退款/补发/丢弃/协商; 统计范围: 所选异常工单; 数据来源: 到货清单签收记录与异常上报",
            _ => "未知导出类型"
        };
    }
}
