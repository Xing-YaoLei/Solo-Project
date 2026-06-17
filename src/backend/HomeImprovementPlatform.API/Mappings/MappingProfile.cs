using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Auth;
using HomeImprovementPlatform.API.DTOs.Document;
using HomeImprovementPlatform.API.DTOs.Material;
using HomeImprovementPlatform.API.DTOs.Payment;
using HomeImprovementPlatform.API.DTOs.Project;
using HomeImprovementPlatform.API.DTOs.Statistics;
using HomeImprovementPlatform.API.Models;

namespace HomeImprovementPlatform.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<ApplicationUser, AuthResponseDto>();
        CreateMap<RegisterDto, ApplicationUser>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email));

        CreateMap<Project, ProjectDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.FullName : string.Empty))
            .ForMember(dest => dest.DesignerName, opt => opt.MapFrom(src => src.Designer != null ? src.Designer.FullName : string.Empty))
            .ForMember(dest => dest.ForemanName, opt => opt.MapFrom(src => src.Foreman != null ? src.Foreman.FullName : string.Empty))
            .ForMember(dest => dest.SupervisorName, opt => opt.MapFrom(src => src.Supervisor != null ? src.Supervisor.FullName : string.Empty))
            .ForMember(dest => dest.DocumentCount, opt => opt.MapFrom(src => src.Documents.Count()))
            .ForMember(dest => dest.PendingApprovals, opt => opt.MapFrom(src => src.Documents.SelectMany(d => d.ApprovalNodes).Count(a => !a.IsApproved)))
            .ForMember(dest => dest.PaidAmount, opt => opt.MapFrom(src => src.PaymentRecords.Where(p => p.Status == Enums.PaymentStatus.Paid).Sum(p => p.Amount)))
            .ForMember(dest => dest.RemainingAmount, opt => opt.MapFrom(src => 
                src.TotalBudget - src.PaymentRecords.Where(p => p.Status == Enums.PaymentStatus.Paid).Sum(p => p.Amount)));
        
        CreateMap<CreateProjectDto, Project>();
        CreateMap<UpdateProjectDto, Project>();

        CreateMap<Document, DocumentDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : string.Empty))
            .ForMember(dest => dest.AmountDifference, opt => opt.MapFrom(src => 
                src.ActualAmount.HasValue ? src.ActualAmount.Value - src.ExpectedAmount : 0))
            .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.Items.Count()))
            .ForMember(dest => dest.AttachmentCount, opt => opt.MapFrom(src => src.Attachments.Count()))
            .ForMember(dest => dest.PendingApprovalCount, opt => opt.MapFrom(src => src.ApprovalNodes.Count(a => !a.IsApproved)));
        
        CreateMap<CreateDocumentDto, Document>();
        CreateMap<UpdateDocumentDto, Document>();
        
        CreateMap<DocumentItem, DocumentItemDto>()
            .ForMember(dest => dest.MaterialName, opt => opt.MapFrom(src => src.Material != null ? src.Material.Name : string.Empty));
        CreateMap<CreateDocumentItemDto, DocumentItem>()
            .ForMember(dest => dest.Subtotal, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
        CreateMap<UpdateDocumentItemDto, DocumentItem>()
            .ForMember(dest => dest.Subtotal, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));

        CreateMap<DocumentHistory, DocumentHistoryDto>()
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : string.Empty));

        CreateMap<PaymentRecord, PaymentRecordDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
            .ForMember(dest => dest.DocumentNumber, opt => opt.MapFrom(src => src.Document != null ? src.Document.DocumentNumber : string.Empty))
            .ForMember(dest => dest.RecordedByName, opt => opt.MapFrom(src => src.RecordedBy != null ? src.RecordedBy.FullName : string.Empty));
        
        CreateMap<CreatePaymentDto, PaymentRecord>();
        CreateMap<UpdatePaymentDto, PaymentRecord>();

        CreateMap<Material, MaterialDto>();
        CreateMap<CreateMaterialDto, Material>();
        CreateMap<UpdateMaterialDto, Material>();

        CreateMap<Document, DocumentSummaryDto>();
        
        CreateMap<Document, AmountInconsistencyDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : string.Empty))
            .ForMember(dest => dest.Difference, opt => opt.MapFrom(src => 
                src.ActualAmount.HasValue ? Math.Abs(src.ActualAmount.Value - src.ExpectedAmount) : Math.Abs(src.ExpectedAmount)))
            .ForMember(dest => dest.DifferencePercentage, opt => opt.MapFrom(src => 
                src.ExpectedAmount > 0 ? $"{(src.ActualAmount.HasValue ? Math.Abs(src.ActualAmount.Value - src.ExpectedAmount) / src.ExpectedAmount * 100 : 100):0.00}%" : "N/A"));
    }
}
