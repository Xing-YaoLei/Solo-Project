using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Document;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
using HomeImprovementPlatform.API.Data;
using System.Text.Json;

namespace HomeImprovementPlatform.API.Services;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetAllAsync(DocumentType? type, DocumentStatus? status, AmountConsistencyStatus? consistency, Guid? projectId, UserRole? userRole, Guid? userId);
    Task<DocumentDto> GetByIdAsync(Guid id);
    Task<DocumentDto> CreateAsync(CreateDocumentDto dto, Guid createdById);
    Task<DocumentDto> UpdateAsync(Guid id, UpdateDocumentDto dto, Guid updatedById);
    Task DeleteAsync(Guid id);
    Task<DocumentDto> SubmitForApprovalAsync(Guid id, Guid userId);
    Task<DocumentDto> ApproveAsync(Guid id, Guid approvalNodeId, string comments, Guid userId);
    Task<DocumentDto> RejectAsync(Guid id, Guid approvalNodeId, string comments, Guid userId);
    Task<DocumentDto> ApproveByUserAsync(Guid id, Guid userId, string comments);
    Task<DocumentDto> RejectByUserAsync(Guid id, Guid userId, string comments);
    Task<IEnumerable<DocumentDto>> BatchUpdateStatusAsync(BatchUpdateDocumentsDto dto, Guid updatedById);
    Task<IEnumerable<DocumentDto>> GetInconsistentDocumentsAsync();
    Task<DocumentDto> VerifyAmountConsistencyAsync(Guid id, Guid userId);
    Task<IEnumerable<DocumentHistoryDto>> GetHistoryAsync(Guid documentId);
}

public class DocumentService : IDocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DocumentService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<DocumentDto>> GetAllAsync(DocumentType? type, DocumentStatus? status, AmountConsistencyStatus? consistency, Guid? projectId, UserRole? userRole, Guid? userId)
    {
        var query = _context.Documents
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Include(d => d.Items)
            .Include(d => d.Attachments)
            .Include(d => d.ApprovalNodes)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(d => d.Type == type.Value);

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);

        if (consistency.HasValue)
            query = query.Where(d => d.AmountConsistency == consistency.Value);

        if (projectId.HasValue)
            query = query.Where(d => d.ProjectId == projectId.Value);

        if (userRole.HasValue && userId.HasValue)
        {
            query = userRole.Value switch
            {
                UserRole.Owner => query.Where(d => d.Project!.OwnerId == userId.Value),
                UserRole.Designer => query.Where(d => d.Project!.DesignerId == userId.Value || d.CreatedById == userId.Value),
                UserRole.Foreman => query.Where(d => d.Project!.ForemanId == userId.Value),
                UserRole.Supervisor => query.Where(d => d.Project!.SupervisorId == userId.Value),
                _ => query
            };
        }

        var documents = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return _mapper.Map<IEnumerable<DocumentDto>>(documents);
    }

    public async Task<DocumentDto> GetByIdAsync(Guid id)
    {
        var document = await _context.Documents
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Include(d => d.Items)
                .ThenInclude(i => i.Material)
            .Include(d => d.Attachments)
            .Include(d => d.ApprovalNodes)
                .ThenInclude(a => a.Approver)
            .Include(d => d.DocumentHistories)
                .ThenInclude(h => h.CreatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        return _mapper.Map<DocumentDto>(document);
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentDto dto, Guid createdById)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var document = _mapper.Map<Document>(dto);
            document.DocumentNumber = $"D-{dto.Type.ToString().ToUpper().Substring(0, 3)}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
            document.CreatedById = createdById;
            document.Status = DocumentStatus.Draft;
            document.AmountConsistency = dto.ExpectedAmount > 0 ? AmountConsistencyStatus.PendingVerification : AmountConsistencyStatus.Consistent;

            document.Items = dto.Items.Select(i => _mapper.Map<DocumentItem>(i)).ToList();

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            var itemsBefore = JsonSerializer.Serialize(new List<DocumentItem>());
            var itemsAfter = JsonSerializer.Serialize(document.Items);
            
            await AddHistory(document.Id, "Create", itemsBefore, itemsAfter, null, null, "System", null, document.Status, createdById);

            document.AmountConsistency = CheckAmountConsistency(document);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return await GetByIdAsync(document.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<DocumentDto> UpdateAsync(Guid id, UpdateDocumentDto dto, Guid updatedById)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var document = await _context.Documents
                .Include(d => d.Items)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
                throw new KeyNotFoundException($"Document with id {id} not found");

            var oldValues = JsonSerializer.Serialize(new
            {
                document.Title,
                document.Description,
                document.ExpectedAmount,
                document.ActualAmount,
                document.Status,
                Items = document.Items
            });

            var oldItems = JsonSerializer.Serialize(document.Items.Select(i => new { i.Id, i.Name, i.Quantity, i.UnitPrice, i.Subtotal }));

            _mapper.Map(dto, document);
            document.UpdatedAt = DateTime.UtcNow;

            foreach (var itemDto in dto.Items)
            {
                if (itemDto.Id.HasValue)
                {
                    var existingItem = document.Items.FirstOrDefault(i => i.Id == itemDto.Id.Value);
                    if (existingItem != null)
                    {
                        _mapper.Map(itemDto, existingItem);
                        existingItem.Subtotal = existingItem.Quantity * existingItem.UnitPrice;
                    }
                }
                else
                {
                    var newItem = _mapper.Map<DocumentItem>(itemDto);
                    newItem.Subtotal = newItem.Quantity * newItem.UnitPrice;
                    document.Items.Add(newItem);
                }
            }

            var itemIdsToKeep = dto.Items.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToList();
            var itemsToRemove = document.Items.Where(i => !itemIdsToKeep.Contains(i.Id)).ToList();
            _context.DocumentItems.RemoveRange(itemsToRemove);

            document.ExpectedAmount = document.Items.Sum(i => i.Subtotal);
            document.AmountConsistency = CheckAmountConsistency(document);

            var newValues = JsonSerializer.Serialize(new
            {
                document.Title,
                document.Description,
                document.ExpectedAmount,
                document.ActualAmount,
                document.Status,
                Items = document.Items
            });

            var newItems = JsonSerializer.Serialize(document.Items.Select(i => new { i.Id, i.Name, i.Quantity, i.UnitPrice, i.Subtotal }));

            await AddHistory(document.Id, "Update", oldValues, newValues, oldItems, newItems, "User", document.Status, document.Status, updatedById);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetByIdAsync(id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        var document = await _context.Documents.FindAsync(id);
        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
    }

    public async Task<DocumentDto> SubmitForApprovalAsync(Guid id, Guid userId)
    {
        var document = await _context.Documents
            .Include(d => d.Project)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var oldStatus = document.Status;
        document.Status = DocumentStatus.PendingApproval;
        document.UpdatedAt = DateTime.UtcNow;

        var approverRoles = new List<UserRole> { UserRole.Supervisor, UserRole.Designer };
        var project = document.Project;

        var approvalNodes = new List<ApprovalNode>
        {
            new() { NodeOrder = 1, NodeName = "监理审核", TargetStatus = DocumentStatus.Approved, ApproverId = project!.SupervisorId ?? userId, DocumentId = id, CreatedAt = DateTime.UtcNow },
            new() { NodeOrder = 2, NodeName = "设计师确认", TargetStatus = DocumentStatus.Approved, ApproverId = project.DesignerId ?? userId, DocumentId = id, CreatedAt = DateTime.UtcNow }
        };

        _context.ApprovalNodes.AddRange(approvalNodes);

        await AddHistory(id, "SubmitForApproval", null, null, null, null, "User", oldStatus, document.Status, userId);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<DocumentDto> ApproveAsync(Guid id, Guid approvalNodeId, string comments, Guid userId)
    {
        var document = await _context.Documents
            .Include(d => d.ApprovalNodes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var approvalNode = document.ApprovalNodes.FirstOrDefault(a => a.Id == approvalNodeId);
        if (approvalNode == null)
            throw new KeyNotFoundException($"Approval node with id {approvalNodeId} not found");

        approvalNode.IsApproved = true;
        approvalNode.Comments = comments;
        approvalNode.ApprovedAt = DateTime.UtcNow;

        var oldStatus = document.Status;
        if (document.ApprovalNodes.All(a => a.IsApproved))
        {
            document.Status = DocumentStatus.Approved;
            document.ApprovalDate = DateTime.UtcNow;
        }

        document.UpdatedAt = DateTime.UtcNow;

        await AddHistory(id, "Approve", null, null, null, null, $"User: {comments}", oldStatus, document.Status, userId);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<DocumentDto> RejectAsync(Guid id, Guid approvalNodeId, string comments, Guid userId)
    {
        var document = await _context.Documents
            .Include(d => d.ApprovalNodes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var approvalNode = document.ApprovalNodes.FirstOrDefault(a => a.Id == approvalNodeId);
        if (approvalNode == null)
            throw new KeyNotFoundException($"Approval node with id {approvalNodeId} not found");

        approvalNode.IsApproved = false;
        approvalNode.Comments = comments;
        approvalNode.ApprovedAt = DateTime.UtcNow;

        var oldStatus = document.Status;
        document.Status = DocumentStatus.Rejected;
        document.UpdatedAt = DateTime.UtcNow;

        await AddHistory(id, "Reject", null, null, null, null, $"User: {comments}", oldStatus, document.Status, userId);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<IEnumerable<DocumentDto>> BatchUpdateStatusAsync(BatchUpdateDocumentsDto dto, Guid updatedById)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var documents = await _context.Documents
                .Where(d => dto.DocumentIds.Contains(d.Id))
                .ToListAsync();

            foreach (var doc in documents)
            {
                var oldStatus = doc.Status;
                if (dto.Status.HasValue)
                {
                    doc.Status = dto.Status.Value;
                    doc.UpdatedAt = DateTime.UtcNow;
                }

                await AddHistory(doc.Id, "BatchUpdate", null, null, null, null, "BatchOperation", oldStatus, doc.Status, updatedById);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await Task.WhenAll(dto.DocumentIds.Select(GetByIdAsync));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<DocumentDto>> GetInconsistentDocumentsAsync()
    {
        var documents = await _context.Documents
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Where(d => d.AmountConsistency == AmountConsistencyStatus.Inconsistent)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<DocumentDto>>(documents);
    }

    public async Task<DocumentDto> VerifyAmountConsistencyAsync(Guid id, Guid userId)
    {
        var document = await _context.Documents
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var oldConsistency = document.AmountConsistency;
        var calculatedTotal = document.Items.Sum(i => i.Subtotal);
        
        document.AmountConsistency = Math.Abs(calculatedTotal - document.ExpectedAmount) < 0.01m 
            ? AmountConsistencyStatus.Consistent 
            : AmountConsistencyStatus.Inconsistent;

        document.UpdatedAt = DateTime.UtcNow;

        await AddHistory(id, "VerifyAmount", 
            $"Old: {oldConsistency}, Expected: {document.ExpectedAmount}", 
            $"New: {document.AmountConsistency}, Calculated: {calculatedTotal}", 
            null, null, "Verification", document.Status, document.Status, userId);

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<IEnumerable<DocumentHistoryDto>> GetHistoryAsync(Guid documentId)
    {
        var histories = await _context.DocumentHistories
            .Include(h => h.CreatedBy)
            .Where(h => h.DocumentId == documentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<DocumentHistoryDto>>(histories);
    }

    public async Task<DocumentDto> ApproveByUserAsync(Guid id, Guid userId, string comments)
    {
        var document = await _context.Documents
            .Include(d => d.ApprovalNodes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var approvalNode = document.ApprovalNodes
            .Where(a => a.ApproverId == userId && !a.IsApproved)
            .OrderBy(a => a.NodeOrder)
            .FirstOrDefault();

        if (approvalNode == null)
            throw new InvalidOperationException("No pending approval node found for this user");

        approvalNode.IsApproved = true;
        approvalNode.Comments = comments;
        approvalNode.ApprovedAt = DateTime.UtcNow;

        var oldStatus = document.Status;
        if (document.ApprovalNodes.All(a => a.IsApproved))
        {
            document.Status = DocumentStatus.Approved;
            document.ApprovalDate = DateTime.UtcNow;
        }

        document.UpdatedAt = DateTime.UtcNow;

        await AddHistory(id, "Approve", null, null, null, null, $"User: {comments}", oldStatus, document.Status, userId);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<DocumentDto> RejectByUserAsync(Guid id, Guid userId, string comments)
    {
        var document = await _context.Documents
            .Include(d => d.ApprovalNodes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"Document with id {id} not found");

        var approvalNode = document.ApprovalNodes
            .Where(a => a.ApproverId == userId && !a.IsApproved)
            .OrderBy(a => a.NodeOrder)
            .FirstOrDefault();

        if (approvalNode == null)
            throw new InvalidOperationException("No pending approval node found for this user");

        approvalNode.IsApproved = false;
        approvalNode.Comments = comments;
        approvalNode.ApprovedAt = DateTime.UtcNow;

        var oldStatus = document.Status;
        document.Status = DocumentStatus.Rejected;
        document.UpdatedAt = DateTime.UtcNow;

        await AddHistory(id, "Reject", null, null, null, null, $"User: {comments}", oldStatus, document.Status, userId);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    private AmountConsistencyStatus CheckAmountConsistency(Document document)
    {
        if (!document.ActualAmount.HasValue)
            return AmountConsistencyStatus.PendingVerification;

        return Math.Abs(document.ActualAmount.Value - document.ExpectedAmount) < 0.01m 
            ? AmountConsistencyStatus.Consistent 
            : AmountConsistencyStatus.Inconsistent;
    }

    private Task AddHistory(Guid documentId, string action, string? oldValues, string? newValues, string? materialsBefore, string? materialsAfter, string source, DocumentStatus? oldStatus, DocumentStatus? newStatus, Guid userId)
    {
        var history = new DocumentHistory
        {
            DocumentId = documentId,
            Action = action,
            OldValues = oldValues,
            NewValues = newValues,
            MaterialsBefore = materialsBefore,
            MaterialsAfter = materialsAfter,
            Conclusion = action,
            Source = source,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.DocumentHistories.Add(history);
        return Task.CompletedTask;
    }
}
