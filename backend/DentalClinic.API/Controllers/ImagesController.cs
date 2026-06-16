using DentalClinic.API.DTOs;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IImageAttachmentService _imageService;

    public ImagesController(IImageAttachmentService imageService)
    {
        _imageService = imageService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ImageAttachmentDto>>> GetImages(
        [FromQuery] int? patientId = null,
        [FromQuery] int? appointmentId = null,
        [FromQuery] int? treatmentPlanId = null,
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var images = await _imageService.GetImagesAsync(
            patientId, appointmentId, treatmentPlanId, category, page, pageSize);

        var total = await _imageService.GetImageCountAsync(
            patientId, appointmentId, treatmentPlanId, category);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(images);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ImageAttachmentDto>> GetImage(int id)
    {
        var image = await _imageService.GetImageByIdAsync(id);
        if (image == null) return NotFound();
        return Ok(image);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<ImageAttachmentDto>> UploadImage(
        [FromForm] IFormFile file,
        [FromForm] int patientId,
        [FromForm] int? appointmentId = null,
        [FromForm] int? treatmentPlanId = null,
        [FromForm] string? description = null,
        [FromForm] string? category = null,
        [FromForm] string? uploadedBy = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Images");
        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var dto = new UploadImageDto
        {
            PatientId = patientId,
            AppointmentId = appointmentId,
            TreatmentPlanId = treatmentPlanId,
            Description = description,
            Category = category,
            UploadedBy = uploadedBy
        };

        var image = await _imageService.UploadImageAsync(
            dto,
            file.FileName,
            filePath,
            file.Length,
            file.ContentType);

        return CreatedAtAction(nameof(GetImage), new { id = image.Id }, image);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteImage(int id)
    {
        var result = await _imageService.DeleteImageAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
