using Microsoft.AspNetCore.Mvc;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificateService;

    public CertificatesController(ICertificateService certificateService)
    {
        _certificateService = certificateService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CertificateDto>>> GetAll([FromQuery] bool? isActive = null)
    {
        var certificates = await _certificateService.GetAllAsync(isActive);
        return Ok(certificates);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CertificateDto>> GetById(int id)
    {
        var certificate = await _certificateService.GetByIdAsync(id);
        if (certificate == null)
            return NotFound();

        return Ok(certificate);
    }

    [HttpPost]
    public async Task<ActionResult<CertificateDto>> Create([FromBody] CertificateCreateDto dto)
    {
        var certificate = await _certificateService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = certificate.Id }, certificate);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CertificateDto>> Update(int id, [FromBody] CertificateUpdateDto dto)
    {
        var certificate = await _certificateService.UpdateAsync(id, dto);
        if (certificate == null)
            return NotFound();

        return Ok(certificate);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _certificateService.DeleteAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}
