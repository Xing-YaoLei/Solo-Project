using CarServiceAppointment.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CarServiceAppointment.API.DTOs;

public class AppointmentDto
{
    public int Id { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public VehicleDto? Vehicle { get; set; }
    public DateTime AppointmentTime { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CompletionTime { get; set; }
    public DateTime? CloseTime { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentSource Source { get; set; }
    public string? PersonInCharge { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentStatus Status { get; set; }
    public string? FaultDescription { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AppointmentDetailDto : AppointmentDto
{
    public QuoteDto? Quote { get; set; }
    public List<InspectionPhotoDto> Photos { get; set; } = new List<InspectionPhotoDto>();
    public List<PartsShortageRecordDto> PartsShortages { get; set; } = new List<PartsShortageRecordDto>();
    public List<ServiceRecordDto> ServiceRecords { get; set; } = new List<ServiceRecordDto>();
    public List<HistoryRecordDto> HistoryRecords { get; set; } = new List<HistoryRecordDto>();
}

public class AppointmentListDto
{
    public int Id { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public DateTime AppointmentTime { get; set; }
    public DateTime? CheckInTime { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentSource Source { get; set; }
    public string? PersonInCharge { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentStatus Status { get; set; }
    public string? FaultDescription { get; set; }
}

public class CreateAppointmentDto
{
    public int VehicleId { get; set; }
    public DateTime AppointmentTime { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentSource Source { get; set; }
    public string? PersonInCharge { get; set; }
    public string? FaultDescription { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateAppointmentDto
{
    public DateTime AppointmentTime { get; set; }
    public string? PersonInCharge { get; set; }
    public string? FaultDescription { get; set; }
    public string? Remarks { get; set; }
}

public class ChangeStatusDto
{
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class PartsShortageHandleDto
{
    public int PartsId { get; set; }
    public int ShortageQuantity { get; set; }
    public DateTime? ExpectedArrivalTime { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
}

public class DataSupplementDto
{
    public string? Remarks { get; set; }
}

public class ReviewDto
{
    public bool Approved { get; set; }
    public string? Remarks { get; set; }
}

public class AppointmentQueryDto
{
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentStatus? Status { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentSource? Source { get; set; }
    public string? PersonInCharge { get; set; }
    public string? Keyword { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class ServiceRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string ServiceItem { get; set; } = string.Empty;
    public string? Technician { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Conclusion { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class HistoryRecordDto
{
    public int Id { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Handler { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentStatus Status { get; set; }
}
