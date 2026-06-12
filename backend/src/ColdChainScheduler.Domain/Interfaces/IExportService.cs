namespace ColdChainScheduler.Domain.Interfaces;

public interface IExportService
{
    Task<byte[]> ExportSettlementSheetAsync(int sheetId);
    Task<byte[]> ExportArrivalListAsync(int listId);
    Task<byte[]> ExportExceptionOrdersAsync(IEnumerable<int> orderIds);
    string GetCaliberDescription(string exportType);
}
