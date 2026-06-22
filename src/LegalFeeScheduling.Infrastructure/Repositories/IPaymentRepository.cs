using LegalFeeScheduling.Domain.Entities;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public interface IPaymentRepository : IRepository<PaymentRecord>
{
    Task<PaymentRecord?> GetByPaymentNoAsync(string paymentNo);
    Task<IEnumerable<PaymentRecord>> GetByQuoteIdAsync(Guid quoteId);
    Task<PaymentRecord> CreatePaymentAsync(PaymentRecord payment);
}
