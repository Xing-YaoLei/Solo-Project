using System.Security.Claims;
using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Enums;
using HearingCalendar.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HearingsController : ControllerBase
{
    private readonly IHearingService _hearingService;
    private readonly IParticipantService _participantService;
    private readonly IAttachmentService _attachmentService;

    public HearingsController(
        IHearingService hearingService,
        IParticipantService participantService,
        IAttachmentService attachmentService)
    {
        _hearingService = hearingService;
        _participantService = participantService;
        _attachmentService = attachmentService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HearingDetailResponse>> GetById(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _hearingService.GetByIdAsync(id, callerUserId);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] HearingStatus? status = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] string? courtRoom = null,
        [FromQuery] bool? conflictFlagged = null)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _hearingService.GetListAsync(page, pageSize, status, fromDate, toDate, courtRoom, conflictFlagged, callerUserId);
        return Ok(result);
    }

    [HttpPost]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<HearingDetailResponse>> Create([FromBody] CreateHearingRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _hearingService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<HearingDetailResponse>> Update(Guid id, [FromBody] UpdateHearingRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _hearingService.UpdateAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _hearingService.ChangeStatusAsync(id, request.Status, userId, request.Reason, request.RelatedAttachmentId);
        return NoContent();
    }

    [HttpPost("batch/status")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<IActionResult> BatchChangeStatus([FromBody] BatchStatusUpdateRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _hearingService.BatchChangeStatusAsync(request, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RoleAuthorize(UserRole.Partner)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _hearingService.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpGet("{id}/available-slots")]
    public async Task<ActionResult<IEnumerable<CalendarSlotResponse>>> GetAvailableSlots(
        Guid id,
        [FromQuery] DateOnly date,
        [FromQuery] string courtRoom)
    {
        var result = await _hearingService.GetAvailableSlotsAsync(date, courtRoom);
        return Ok(result);
    }

    [HttpPost("{id}/participants")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<ParticipantResponse>> AddParticipant(
        Guid id,
        [FromBody] AddParticipantRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var participantRequest = request with { HearingId = id };
        var result = await _participantService.AddAsync(participantRequest, userId);
        return Ok(result);
    }

    [HttpPut("participants/{participantId}/attendance")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<ParticipantResponse>> UpdateAttendance(
        Guid participantId,
        [FromBody] UpdateAttendanceRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _participantService.UpdateAttendanceAsync(participantId, request, userId);
        return Ok(result);
    }

    [HttpPost("participants/batch-attendance")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<IActionResult> BatchUpdateAttendance([FromBody] BatchAttendanceRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _participantService.BatchUpdateAttendanceAsync(request, userId);
        return NoContent();
    }

    [HttpDelete("participants/{participantId}")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<IActionResult> RemoveParticipant(Guid participantId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _participantService.RemoveAsync(participantId, userId);
        return NoContent();
    }

    [HttpGet("{id}/participants")]
    public async Task<ActionResult<IEnumerable<ParticipantResponse>>> GetParticipants(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _participantService.GetByHearingAsync(id, callerUserId);
        return Ok(result);
    }

    [HttpPost("{id}/attachments")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<AttachmentResponse>> UploadAttachment(
        Guid id,
        IFormFile file,
        [FromForm] AttachmentType attachmentType,
        [FromForm] string? description)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        using var stream = file.OpenReadStream();
        var result = await _attachmentService.UploadAsync(
            id, stream, file.FileName, file.Length, file.ContentType, attachmentType, userId, description);
        return Ok(result);
    }

    [HttpGet("attachments/{attachmentId}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid attachmentId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var (stream, fileName, contentType) = await _attachmentService.DownloadAsync(attachmentId, callerUserId);
        return File(stream, contentType, fileName);
    }

    [HttpDelete("attachments/{attachmentId}")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Partner)]
    public async Task<IActionResult> DeleteAttachment(Guid attachmentId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _attachmentService.DeleteAsync(attachmentId, userId);
        return NoContent();
    }

    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<IEnumerable<AttachmentResponse>>> GetAttachments(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _attachmentService.GetByHearingAsync(id, callerUserId);
        return Ok(result);
    }
}

public record ChangeStatusRequest(HearingStatus Status, string? Reason, Guid? RelatedAttachmentId);
