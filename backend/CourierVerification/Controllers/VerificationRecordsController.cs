using CourierVerification.Data;
using CourierVerification.DTOs;
using CourierVerification.Enums;
using CourierVerification.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourierVerification.Controllers;

[ApiController]
[Route("api/verification-records")]
public class VerificationRecordsController : ControllerBase
{
    private readonly AppDbContext _context;

    public VerificationRecordsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        string? keyword,
        VerificationStatus? status,
        VerificationStage? stage,
        Guid? riderId,
        DateTime? startDate,
        DateTime? endDate,
        int page = 1,
        int pageSize = 20)
    {
        try
        {
            var query = _context.VerificationRecords
                .Include(v => v.Order)
                .Include(v => v.Rider)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(v =>
                    v.RecordNo.Contains(keyword) ||
                    (v.Remark != null && v.Remark.Contains(keyword)) ||
                    (v.Order != null && v.Order.OrderNumber.Contains(keyword)) ||
                    (v.Rider != null && v.Rider.Name.Contains(keyword)));
            }

            if (status.HasValue)
                query = query.Where(v => v.Status == status.Value);

            if (stage.HasValue)
                query = query.Where(v => v.Stage == stage.Value);

            if (riderId.HasValue)
                query = query.Where(v => v.RiderId == riderId.Value);

            if (startDate.HasValue)
                query = query.Where(v => v.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(v => v.CreatedAt <= endDate.Value);

            query = query.OrderByDescending(v => v.CreatedAt);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<VerificationRecord>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var record = await _context.VerificationRecords
                .Include(v => v.Order)
                .Include(v => v.Rider)
                .Include(v => v.Photos)
                .Include(v => v.Attachments)
                .Include(v => v.DamageReports)
                .Include(v => v.Reviews)
                .Include(v => v.TimePoints)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (record == null)
                return NotFound("核验记录不存在");

            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVerificationRecordDto dto)
    {
        try
        {
            var random = new Random();
            var recordNo = "HY" + DateTime.Now.ToString("yyyyMMddHHmmss") + random.Next(100, 1000).ToString();

            var record = new VerificationRecord
            {
                Id = Guid.NewGuid(),
                OrderId = dto.OrderId,
                RecordNo = recordNo,
                Stage = VerificationStage.Entry,
                Status = VerificationStatus.Pending,
                AssignedTo = dto.AssignedTo,
                HandlerId = dto.HandlerId,
                HandlerName = dto.HandlerName,
                Remark = dto.Remark,
                RatingTags = dto.RatingTags ?? new List<string>(),
                RiderTrajectory = dto.RiderTrajectory,
                RiderId = dto.RiderId,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.VerificationRecords.Add(record);

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "Created",
                PointTime = DateTimeOffset.UtcNow,
                Description = "核验记录已创建"
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = record.Id }, record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVerificationRecordDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            if (dto.Status.HasValue) record.Status = dto.Status.Value;
            if (dto.Stage.HasValue) record.Stage = dto.Stage.Value;
            if (dto.AssignedTo != null) record.AssignedTo = dto.AssignedTo;
            if (dto.HandlerId != null) record.HandlerId = dto.HandlerId;
            if (dto.HandlerName != null) record.HandlerName = dto.HandlerName;
            if (dto.Remark != null) record.Remark = dto.Remark;
            if (dto.RatingTags != null) record.RatingTags = dto.RatingTags;
            if (dto.RiderTrajectory != null) record.RiderTrajectory = dto.RiderTrajectory;
            record.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/confirm")]
    public async Task<IActionResult> Confirm(Guid id, [FromBody] ConfirmationDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            record.Status = VerificationStatus.Confirmed;
            record.Stage = VerificationStage.Action;
            record.ConfirmedAt = DateTimeOffset.UtcNow;
            record.UpdatedAt = DateTimeOffset.UtcNow;

            if (dto.HandlerId != null) record.HandlerId = dto.HandlerId;
            if (dto.HandlerName != null) record.HandlerName = dto.HandlerName;
            if (dto.Remark != null) record.Remark = dto.Remark;

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "Confirmed",
                PointTime = DateTimeOffset.UtcNow,
                OperatorId = dto.HandlerId,
                OperatorName = dto.HandlerName,
                Description = "核验记录已确认"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/supplement")]
    public async Task<IActionResult> Supplement(Guid id, [FromForm] SupplementDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            if (dto.Remark != null) record.Remark = dto.Remark;
            if (dto.RatingTags != null) record.RatingTags = dto.RatingTags;
            record.Status = VerificationStatus.Supplemented;
            record.SupplementedAt = DateTimeOffset.UtcNow;
            record.UpdatedAt = DateTimeOffset.UtcNow;

            if (dto.Files != null && dto.Files.Count > 0)
            {
                var supplementDir = Path.Combine("Uploads", "Supplements");
                var attachmentDir = Path.Combine("Uploads", "Attachments");
                Directory.CreateDirectory(supplementDir);
                Directory.CreateDirectory(attachmentDir);

                foreach (var file in dto.Files)
                {
                    var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                    var isImage = file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);

                    if (isImage)
                    {
                        var filePath = Path.Combine(supplementDir, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        _context.VerificationPhotos.Add(new VerificationPhoto
                        {
                            Id = Guid.NewGuid(),
                            VerificationRecordId = record.Id,
                            PhotoUrl = $"/Uploads/Supplements/{fileName}",
                            PhotoType = PhotoType.Verification,
                            IsDamagePhoto = false,
                            UploadedAt = DateTimeOffset.UtcNow
                        });
                    }
                    else
                    {
                        var filePath = Path.Combine(attachmentDir, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        _context.VerificationAttachments.Add(new VerificationAttachment
                        {
                            Id = Guid.NewGuid(),
                            VerificationRecordId = record.Id,
                            FileName = file.FileName,
                            FileUrl = $"/Uploads/Attachments/{fileName}",
                            FileSize = file.Length,
                            ContentType = file.ContentType,
                            UploadedAt = DateTimeOffset.UtcNow
                        });
                    }
                }
            }

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "Supplemented",
                PointTime = DateTimeOffset.UtcNow,
                Description = "核验记录已补充"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> Close(Guid id, [FromBody] CloseDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            record.Status = VerificationStatus.Closed;
            record.Stage = VerificationStage.Review;
            record.ClosedAt = DateTimeOffset.UtcNow;
            record.UpdatedAt = DateTimeOffset.UtcNow;

            if (dto.HandlerId != null) record.HandlerId = dto.HandlerId;
            if (dto.HandlerName != null) record.HandlerName = dto.HandlerName;

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "Closed",
                PointTime = DateTimeOffset.UtcNow,
                OperatorId = dto.HandlerId,
                OperatorName = dto.HandlerName,
                Description = dto.ClosingRemark ?? "核验记录已关闭"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/report-damage")]
    public async Task<IActionResult> ReportDamage(Guid id, [FromBody] DamageReportDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            var damageReport = new DamageReport
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                DamageRange = dto.DamageRange,
                Severity = dto.Severity,
                DamageDescription = dto.DamageDescription,
                AffectedItems = dto.AffectedItems,
                InitialResponsibility = dto.InitialResponsibility,
                ReportedBy = dto.ReportedBy,
                ReportedAt = DateTimeOffset.UtcNow
            };

            _context.DamageReports.Add(damageReport);

            record.Status = VerificationStatus.Damaged;
            record.Stage = VerificationStage.Review;
            record.UpdatedAt = DateTimeOffset.UtcNow;

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "DamageReported",
                PointTime = DateTimeOffset.UtcNow,
                Description = "损坏已报告"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/adjust-responsibility")]
    public async Task<IActionResult> AdjustResponsibility(Guid id, [FromBody] ResponsibilityAdjustmentDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            var damageReport = await _context.DamageReports
                .FirstOrDefaultAsync(d => d.VerificationRecordId == id);

            if (damageReport == null)
                return NotFound("损坏报告不存在");

            damageReport.FinalResponsibility = dto.FinalResponsibility;
            damageReport.ResponsibilityAdjustedBy = dto.AdjustedBy;
            damageReport.ResponsibilityAdjustedAt = DateTimeOffset.UtcNow;
            damageReport.SupplementaryNotes = dto.SupplementaryNotes;

            record.UpdatedAt = DateTimeOffset.UtcNow;

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "ResponsibilityAdjusted",
                PointTime = DateTimeOffset.UtcNow,
                OperatorId = dto.AdjustedBy,
                Description = $"责任归属已调整为 {dto.FinalResponsibility}"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("bulk-close")]
    public async Task<IActionResult> BulkClose([FromBody] List<Guid> ids)
    {
        try
        {
            var records = await _context.VerificationRecords
                .Where(v => ids.Contains(v.Id))
                .ToListAsync();

            foreach (var record in records)
            {
                record.Status = VerificationStatus.Closed;
                record.Stage = VerificationStage.Review;
                record.ClosedAt = DateTimeOffset.UtcNow;
                record.UpdatedAt = DateTimeOffset.UtcNow;

                _context.TimePoints.Add(new TimePoint
                {
                    Id = Guid.NewGuid(),
                    VerificationRecordId = record.Id,
                    PointType = "Closed",
                    PointTime = DateTimeOffset.UtcNow,
                    Description = "批量关闭"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { ClosedCount = records.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/photos")]
    public async Task<IActionResult> AddPhoto(Guid id, IFormFile file, string? photoType, bool isDamagePhoto = false)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            var photoDir = Path.Combine("Uploads", "Photos");
            Directory.CreateDirectory(photoDir);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(photoDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var photoTypeValue = Enum.TryParse<PhotoType>(photoType, out var pt) ? pt : PhotoType.Verification;

            var photo = new VerificationPhoto
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PhotoUrl = $"/Uploads/Photos/{fileName}",
                PhotoType = photoTypeValue,
                IsDamagePhoto = isDamagePhoto,
                UploadedAt = DateTimeOffset.UtcNow
            };

            _context.VerificationPhotos.Add(photo);
            record.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(photo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/attachments")]
    public async Task<IActionResult> AddAttachment(Guid id, IFormFile file)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            var attachmentDir = Path.Combine("Uploads", "Attachments");
            Directory.CreateDirectory(attachmentDir);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(attachmentDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new VerificationAttachment
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                FileName = file.FileName,
                FileUrl = $"/Uploads/Attachments/{fileName}",
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTimeOffset.UtcNow
            };

            _context.VerificationAttachments.Add(attachment);
            record.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(attachment);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost("{id}/complete-review")]
    public async Task<IActionResult> CompleteReview(Guid id, [FromBody] ReviewDto dto)
    {
        try
        {
            var record = await _context.VerificationRecords.FindAsync(id);
            if (record == null)
                return NotFound("核验记录不存在");

            var review = new ReviewRecord
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                Reviewer = dto.Reviewer,
                ReviewedAt = DateTimeOffset.UtcNow,
                Findings = dto.Findings,
                ActionsTaken = dto.ActionsTaken,
                Conclusion = dto.Conclusion,
                FollowUpRequired = dto.FollowUpRequired,
                FollowUpNote = dto.FollowUpNote
            };

            _context.ReviewRecords.Add(review);

            record.UpdatedAt = DateTimeOffset.UtcNow;

            _context.TimePoints.Add(new TimePoint
            {
                Id = Guid.NewGuid(),
                VerificationRecordId = record.Id,
                PointType = "ReviewCompleted",
                PointTime = DateTimeOffset.UtcNow,
                Description = "复盘已完成"
            });

            await _context.SaveChangesAsync();
            return Ok(record);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }
}
