using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Data;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Application.Services;

public class ParticipantService : IParticipantService
{
    private readonly IRepository<HearingParticipant> _participantRepo;
    private readonly IRepository<HearingSchedule> _hearingRepo;
    private readonly IRepository<CapacityRule> _capacityRuleRepo;
    private readonly AuditTrailRepository _auditTrailRepo;
    private readonly HearingCalendarDbContext _dbContext;

    public ParticipantService(
        IRepository<HearingParticipant> participantRepo,
        IRepository<HearingSchedule> hearingRepo,
        IRepository<CapacityRule> capacityRuleRepo,
        AuditTrailRepository auditTrailRepo,
        HearingCalendarDbContext dbContext)
    {
        _participantRepo = participantRepo;
        _hearingRepo = hearingRepo;
        _capacityRuleRepo = capacityRuleRepo;
        _auditTrailRepo = auditTrailRepo;
        _dbContext = dbContext;
    }

    public async Task<ParticipantResponse> AddAsync(AddParticipantRequest request, Guid userId)
    {
        var hearing = await _hearingRepo.GetByIdAsync(request.HearingId);
        if (hearing is null)
            throw new KeyNotFoundException($"Hearing {request.HearingId} not found");

        var rules = await _capacityRuleRepo.FindAsync(r =>
            r.CourtRoom == hearing.CourtRoom && r.IsActive &&
            r.EffectiveFrom <= hearing.HearingDate &&
            (r.EffectiveTo == null || r.EffectiveTo >= hearing.HearingDate));

        var rule = rules.FirstOrDefault();
        if (rule is not null)
        {
            var participants = await _participantRepo.FindAsync(p => p.HearingId == request.HearingId);
            if (participants.Count() >= rule.MaxParticipantsPerHearing)
                throw new InvalidOperationException($"Participant capacity exceeded for hearing {request.HearingId}");
        }

        var participant = new HearingParticipant
        {
            HearingId = request.HearingId,
            UserId = request.UserId,
            Role = request.Role,
            AttendanceStatus = AttendanceStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _participantRepo.AddAsync(participant);
        await _auditTrailRepo.LogAsync(nameof(HearingParticipant), created.Id, "Add", userId);

        return await MapToResponseAsync(created.Id);
    }

    public async Task<ParticipantResponse> UpdateAttendanceAsync(Guid participantId, UpdateAttendanceRequest request, Guid userId)
    {
        var participant = await _participantRepo.GetByIdAsync(participantId);
        if (participant is null)
            throw new KeyNotFoundException($"Participant {participantId} not found");

        participant.AttendanceStatus = request.AttendanceStatus;
        participant.CheckInTime = request.CheckInTime;
        if (request.Notes is not null) participant.Notes = request.Notes;

        await _participantRepo.UpdateAsync(participant);
        await _auditTrailRepo.LogAsync(nameof(HearingParticipant), participantId, "UpdateAttendance", userId);

        return await MapToResponseAsync(participantId);
    }

    public async Task BatchUpdateAttendanceAsync(BatchAttendanceRequest request, Guid userId)
    {
        foreach (var item in request.Updates)
        {
            await UpdateAttendanceAsync(item.ParticipantId, new UpdateAttendanceRequest(
                item.AttendanceStatus, item.CheckInTime, item.Notes), userId);
        }
    }

    public async Task RemoveAsync(Guid participantId, Guid userId)
    {
        var participant = await _participantRepo.GetByIdAsync(participantId);
        if (participant is null)
            throw new KeyNotFoundException($"Participant {participantId} not found");

        await _participantRepo.DeleteAsync(participantId);
        await _auditTrailRepo.LogAsync(nameof(HearingParticipant), participantId, "Remove", userId);
    }

    public async Task<IEnumerable<ParticipantResponse>> GetByHearingAsync(Guid hearingId)
    {
        var participants = await _dbContext.HearingParticipants
            .Include(p => p.User)
            .Where(p => p.HearingId == hearingId)
            .ToListAsync();

        return participants.Select(p => new ParticipantResponse(
            p.Id, p.HearingId, p.UserId,
            p.User?.FullName ?? string.Empty,
            p.Role, p.AttendanceStatus, p.CheckInTime, p.Notes));
    }

    private async Task<ParticipantResponse> MapToResponseAsync(Guid participantId)
    {
        var participant = await _dbContext.HearingParticipants
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == participantId);

        if (participant is null)
            throw new KeyNotFoundException($"Participant {participantId} not found");

        return new ParticipantResponse(
            participant.Id, participant.HearingId, participant.UserId,
            participant.User?.FullName ?? string.Empty,
            participant.Role, participant.AttendanceStatus, participant.CheckInTime, participant.Notes);
    }
}
