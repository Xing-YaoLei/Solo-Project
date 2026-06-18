namespace AutoRepair.Application.DTOs;

public class VehicleDto
{
    public Guid Id { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string VinCode { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Series { get; set; }
    public int? ManufactureYear { get; set; }
    public string? Color { get; set; }
    public int Mileage { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerPhone { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public int? NextMaintenanceMileage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VehicleCreateDto
{
    public string LicensePlate { get; set; } = string.Empty;
    public string VinCode { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Series { get; set; }
    public int? ManufactureYear { get; set; }
    public string? Color { get; set; }
    public int Mileage { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerPhone { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public int? NextMaintenanceMileage { get; set; }
}

public class VehicleUpdateDto
{
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int Mileage { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerPhone { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public int? NextMaintenanceMileage { get; set; }
}
