using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public class PaymentRepository : Repository<PaymentRecord>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context) { }

    public async Task<PaymentRecord?> GetByPaymentNoAsync(string paymentNo)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.PaymentNo == paymentNo);
    }

    public async Task<IEnumerable<PaymentRecord>> GetByQuoteIdAsync(Guid quoteId)
    {
        return await _dbSet
            .Where(p => p.QuoteId == quoteId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();
    }

    public async Task<PaymentRecord> CreatePaymentAsync(PaymentRecord payment)
    {
        if (payment.Id == Guid.Empty)
        {
            payment.Id = Guid.NewGuid();
        }

        await _dbSet.AddAsync(payment);

        var quote = await _context.Quotes.FindAsync(payment.QuoteId);
        if (quote is not null)
        {
            var allPayments = await _dbSet
                .Where(p => p.QuoteId == payment.QuoteId)
                .ToListAsync();

            var totalPaid = allPayments.Sum(p => p.Amount);

            if (totalPaid >= quote.FinalAmount && quote.FinalAmount > 0)
            {
                payment.Status = PaymentStatus.Paid;
                foreach (var p in allPayments)
                {
                    if (p.Status != PaymentStatus.Paid)
                    {
                        p.Status = PaymentStatus.Paid;
                        _dbSet.Update(p);
                    }
                }
            }
            else if (totalPaid > 0)
            {
                payment.Status = PaymentStatus.Partial;
            }
            else
            {
                payment.Status = PaymentStatus.Pending;
            }
        }

        await _context.SaveChangesAsync();
        return payment;
    }
}
