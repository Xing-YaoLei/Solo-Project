using ElderCare.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/staff")]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _context;

    public StaffController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var staff = await _context.Staff.Include(s => s.Area).ToListAsync();
        return Ok(staff.Select(s => new
        {
            s.Id,
            s.Name,
            s.Role,
            s.Phone,
            s.Email,
            s.AreaId,
            AreaName = s.Area != null ? s.Area.Name : ""
        }));
    }
}
