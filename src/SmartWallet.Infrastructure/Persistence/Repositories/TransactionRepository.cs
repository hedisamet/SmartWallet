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

    public async Task<IEnumerable<Transaction>> GetAllAsync(
        int page, int pageSize, string? status, CancellationToken ct)
    {
        var query = _context.Transactions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == Enum.Parse<TransactionStatus>(status, true));

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    // ----------------------------------------------------------
    // Suspicious activity detection — rule-based.
    // Rule 1: more than 5 transactions in the last hour
    // Rule 2: single transaction over 5000 TND
    // Rule 3: more than 3 failed transactions in the last hour
    // These are the same rules real fintechs start with before
    // moving to ML-based anomaly detection.
    // ----------------------------------------------------------
    public async Task<IEnumerable<SuspiciousActivityFlag>> GetSuspiciousActivityAsync(
        CancellationToken ct)
    {
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);
        var flags      = new List<SuspiciousActivityFlag>();

        // Rule 1 — high frequency: more than 5 transfers in last hour
        var highFrequency = await _context.Transactions
            .Where(t => t.CreatedAt >= oneHourAgo
                     && t.Type == TransactionType.Transfer)
            .GroupBy(t => t.SenderWalletId)
            .Where(g => g.Count() > 5)
            .Select(g => new
            {
                WalletId         = g.Key,
                TransactionCount = g.Count(),
                TotalAmount      = g.Sum(t => t.Amount)
            })
            .ToListAsync(ct);

        flags.AddRange(highFrequency.Select(f => new SuspiciousActivityFlag(
            f.WalletId,
            "High frequency: more than 5 transfers in the last hour",
            f.TransactionCount,
            f.TotalAmount,
            DateTime.UtcNow
        )));

        // Rule 2 — large single transaction over 5000
        var largeTransactions = await _context.Transactions
            .Where(t => t.Amount > 5000m
                     && t.Type == TransactionType.Transfer
                     && t.CreatedAt >= oneHourAgo)
            .GroupBy(t => t.SenderWalletId)
            .Select(g => new
            {
                WalletId         = g.Key,
                TransactionCount = g.Count(),
                TotalAmount      = g.Sum(t => t.Amount)
            })
            .ToListAsync(ct);

        flags.AddRange(largeTransactions.Select(f => new SuspiciousActivityFlag(
            f.WalletId,
            "Large transaction: single transfer over 5000 TND",
            f.TransactionCount,
            f.TotalAmount,
            DateTime.UtcNow
        )));

        // Rule 3 — repeated failures: more than 3 failed in last hour
        var repeatedFailures = await _context.Transactions
            .Where(t => t.Status == TransactionStatus.Failed
                     && t.CreatedAt >= oneHourAgo)
            .GroupBy(t => t.SenderWalletId)
            .Where(g => g.Count() > 3)
            .Select(g => new
            {
                WalletId         = g.Key,
                TransactionCount = g.Count(),
                TotalAmount      = g.Sum(t => t.Amount)
            })
            .ToListAsync(ct);

        flags.AddRange(repeatedFailures.Select(f => new SuspiciousActivityFlag(
            f.WalletId,
            "Repeated failures: more than 3 failed transactions in the last hour",
            f.TransactionCount,
            f.TotalAmount,
            DateTime.UtcNow
        )));

        return flags;
    }

    public async Task AddAsync(Transaction transaction, CancellationToken ct)
        => await _context.Transactions.AddAsync(transaction, ct);

    public void Update(Transaction transaction)
    {
        var entry = _context.Entry(transaction);
        if (entry.State == EntityState.Detached)
            _context.Transactions.Update(transaction);
    }
}