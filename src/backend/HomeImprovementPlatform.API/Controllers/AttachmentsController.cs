using System.Security.Claims;
using HomeImprovementPlatform.API.Data;
using HomeImprovementPlatform.API.DTOs.Auth;
using HomeImprovementPlatform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public AttachmentsController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("upload/{documentId}")]
    [Authorize(Roles = "Designer,Foreman,Supervisor")]
    public async Task<ActionResult<Attachment>> Upload(Guid documentId, IFormFile file, [FromForm] string? description)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null)
            return NotFound(new { message = $"Document with id {documentId} not found" });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "Uploads");
        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var attachment = new Attachment
        {
            DocumentId = documentId,
            FileName = fileName,
            OriginalFileName = file.FileName,
            FilePath = $"/Uploads/{fileName}",
            ContentType = file.ContentType,
            FileSize = file.Length,
            Description = description,
            UploadedById = GetCurrentUserId(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        return Ok(attachment);
    }

    [HttpGet("document/{documentId}")]
    public async Task<ActionResult<IEnumerable<Attachment>>> GetByDocument(Guid documentId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.DocumentId == documentId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment == null)
            return NotFound(new { message = $"Attachment with id {id} not found" });

        var fullPath = Path.Combine(_env.ContentRootPath, attachment.FilePath.TrimStart('/'));
        if (System.IO.File.Exists(fullPath))
            System.IO.File.Delete(fullPath);

        _context.Attachments.Remove(attachment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
