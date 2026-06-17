
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Staff;
using MoveOutInspection.Core.Interfaces;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public StaffController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffDto>>> GetStaffs()
    {
        var staffs = await _unitOfWork.Staffs.GetAllAsync();
        var dtos = staffs.Select(s => new StaffDto
        {
            Id = s.Id,
            Name = s.Name,
            EmployeeId = s.EmployeeId,
            Phone = s.Phone,
            Email = s.Email,
            Role = s.Role,
            Department = s.Department,
            IsActive = s.IsActive
        }).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StaffDto>> GetStaff(Guid id)
    {
        var staff = await _unitOfWork.Staffs.GetByIdAsync(id);
        if (staff == null) return NotFound();
        return Ok(new StaffDto
        {
            Id = staff.Id,
            Name = staff.Name,
            EmployeeId = staff.EmployeeId,
            Phone = staff.Phone,
            Email = staff.Email,
            Role = staff.Role,
            Department = staff.Department,
            IsActive = staff.IsActive
        });
    }
}
