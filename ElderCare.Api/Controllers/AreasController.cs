using ElderCare.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/areas")]
public class AreasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AreasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var areas = await _context.Areas.ToListAsync();
        return Ok(areas);
    }
}
