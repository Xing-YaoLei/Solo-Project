namespace CarServiceAppointment.API.DTOs;

public class VehicleDto
{
    public int Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string VinNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateVehicleDto
{
    public string PlateNumber { get; set; } = string.Empty;
    public string VinNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
}

public class UpdateVehicleDto
{
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
}
