using CarServiceAppointment.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CarServiceAppointment.API.DTOs;

public class QuoteDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public decimal LaborCost { get; set; }
    public decimal PartsCost { get; set; }
    public decimal TotalAmount { get; set; }
    [JsonConverter(typeof(StringEnumConverter))]
    public QuoteStatus Status { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<QuoteItemDto> QuoteItems { get; set; } = new List<QuoteItemDto>();
}

public class QuoteItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    [JsonConverter(typeof(StringEnumConverter))]
    public QuoteItemType Type { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? Remarks { get; set; }
}

public class CreateQuoteDto
{
    public int AppointmentId { get; set; }
    public string? Remarks { get; set; }
    public List<CreateQuoteItemDto> QuoteItems { get; set; } = new List<CreateQuoteItemDto>();
}

public class CreateQuoteItemDto
{
    public string Name { get; set; } = string.Empty;
    [JsonConverter(typeof(StringEnumConverter))]
    public QuoteItemType Type { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateQuoteDto
{
    public string? Remarks { get; set; }
    public List<UpdateQuoteItemDto> QuoteItems { get; set; } = new List<UpdateQuoteItemDto>();
}

public class UpdateQuoteItemDto
{
    public int? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    [JsonConverter(typeof(StringEnumConverter))]
    public QuoteItemType Type { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Remarks { get; set; }
}
