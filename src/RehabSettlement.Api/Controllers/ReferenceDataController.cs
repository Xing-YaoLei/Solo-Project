using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReferenceDataController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReferenceDataController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("patients")]
    public async Task<ActionResult<List<PatientDto>>> GetPatients(string? keyword = null)
    {
        var query = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(p => p.Name.Contains(keyword) || p.PatientNo.Contains(keyword));
        }

        var result = await query
            .OrderBy(p => p.Name)
            .Select(p => new PatientDto
            {
                Id = p.Id,
                PatientNo = p.PatientNo,
                Name = p.Name,
                Gender = p.Gender,
                BirthDate = p.BirthDate,
                Phone = p.Phone,
                InsuranceType = p.InsuranceType,
                InsuranceNo = p.InsuranceNo,
                SourceChannelId = p.SourceChannelId
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("patients/{id}")]
    public async Task<ActionResult<PatientDto>> GetPatient(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return NotFound();

        return Ok(new PatientDto
        {
            Id = patient.Id,
            PatientNo = patient.PatientNo,
            Name = patient.Name,
            Gender = patient.Gender,
            BirthDate = patient.BirthDate,
            Phone = patient.Phone,
            InsuranceType = patient.InsuranceType,
            InsuranceNo = patient.InsuranceNo,
            SourceChannelId = patient.SourceChannelId
        });
    }

    [HttpGet("source-channels")]
    public async Task<ActionResult<List<SourceChannelDto>>> GetSourceChannels()
    {
        var result = await _context.SourceChannels
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new SourceChannelDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> GetUsers(string? role = null)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role == role);
        }

        var result = await query
            .Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Name = u.Name,
                Role = u.Role,
                Department = u.Department
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("rejection-reasons")]
    public async Task<ActionResult<List<RejectionReasonDto>>> GetRejectionReasons()
    {
        var result = await _context.RejectionReasons
            .Where(r => r.IsActive)
            .OrderBy(r => r.Name)
            .Select(r => new RejectionReasonDto
            {
                Id = r.Id,
                Code = r.Code,
                Name = r.Name,
                Description = r.Description
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("review-tags")]
    public async Task<ActionResult<List<ReviewTagDto>>> GetReviewTags()
    {
        var result = await _context.ReviewTags
            .OrderBy(r => r.Name)
            .Select(r => new ReviewTagDto
            {
                Id = r.Id,
                Name = r.Name,
                Color = r.Color,
                Description = r.Description
            })
            .ToListAsync();

        return Ok(result);
    }
}

public class PatientDto
{
    public int Id { get; set; }
    public string PatientNo { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? InsuranceType { get; set; }
    public string? InsuranceNo { get; set; }
    public int? SourceChannelId { get; set; }
}

public class SourceChannelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Department { get; set; }
}

public class RejectionReasonDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ReviewTagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Description { get; set; }
}
