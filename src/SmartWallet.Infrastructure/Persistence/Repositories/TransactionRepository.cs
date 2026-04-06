using Microsoft.EntityFrameworkCore;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context) => _context = context;

    public async Task<Transaction?> FindByIdempotencyKeyAsync(Guid key, CancellationToken ct)
        => await _context.Transactions
            .FirstOrDefaultAsync(t => t.IdempotencyKey == key, ct);

    public async Task<IEnumerable<Transaction>> GetByWalletIdAsync(
        Guid walletId, int page, int pageSize, CancellationToken ct)
        => await _context.Transactions
            .Where(t => t.SenderWalletId == walletId || t.ReceiverWalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task AddAsync(Transaction transaction, CancellationToken ct)
        => await _context.Transactions.AddAsync(transaction, ct);

    public void Update(Transaction transaction)
    {
        var entry = _context.Entry(transaction);
        if (entry.State == Microsoft.EntityFrameworkCore.EntityState.Detached)
            _context.Transactions.Update(transaction);
    }
}