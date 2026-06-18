using CarServiceAppointment.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CarServiceAppointment.API.DTOs;

public class PartsDto
{
    public int Id { get; set; }
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public int StockQuantity { get; set; }
    public int SafetyStock { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Supplier { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLowStock => StockQuantity < SafetyStock;
}

public class CreatePartsDto
{
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public int StockQuantity { get; set; }
    public int SafetyStock { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Supplier { get; set; }
}

public class UpdatePartsDto
{
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public int SafetyStock { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Supplier { get; set; }
}

public class UpdateStockDto
{
    public int Quantity { get; set; }
}

public class PartsShortageRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public int PartsId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public string? PartCode { get; set; }
    public int ShortageQuantity { get; set; }
    public DateTime? ExpectedArrivalTime { get; set; }
    public DateTime? ActualArrivalTime { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public PartsShortageStatus Status { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreatePartsShortageDto
{
    public int AppointmentId { get; set; }
    public int PartsId { get; set; }
    public int ShortageQuantity { get; set; }
    public DateTime? ExpectedArrivalTime { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
}
