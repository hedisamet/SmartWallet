using Microsoft.EntityFrameworkCore;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Application.Common;

namespace SmartWallet.Infrastructure.Persistence.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context) => _context = context;

    public async Task<Transaction?> FindByIdempotencyKeyAsync(Guid key, CancellationToken ct)
        => await _context.Transactions
            .FirstOrDefaultAsync(t => t.IdempotencyKey == key, ct);

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Transactions.FindAsync(new object[] { id }, ct);

    public async Task<IEnumerable<TransactionHistoryItem>> GetByWalletIdEnrichedAsync(
        Guid walletId, int page, int pageSize, CancellationToken ct)
    {
        var transactions = await _context.Transactions
            .Where(t => t.SenderWalletId == walletId || t.ReceiverWalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Fetch user names for these wallets
        var walletIds = transactions.Select(t => t.SenderWalletId)
            .Concat(transactions.Select(t => t.ReceiverWalletId))
            .Distinct();

        var walletNameMap = await _context.Wallets
            .Where(w => walletIds.Contains(w.Id))
            .Join(_context.Users, 
                  w => w.UserId, 
                  u => u.Id, 
                  (w, u) => new { w.Id, u.FullName })
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        return transactions.Select(t => new TransactionHistoryItem(
            t.Id,
            t.IdempotencyKey,
            t.Amount,
            t.Currency,
            t.Type.ToString(),
            t.Status.ToString(),
            t.SenderWalletId,
            walletNameMap.GetValueOrDefault(t.SenderWalletId, "System"),
            t.ReceiverWalletId,
            walletNameMap.GetValueOrDefault(t.ReceiverWalletId, "System"),
            t.Description,
            t.CreatedAt,
            t.CompletedAt
        ));
    }

    public async Task<int> CountByWalletIdAsync(Guid walletId, CancellationToken ct)
        => await _context.Transactions
            .CountAsync(t => t.SenderWalletId == walletId || t.ReceiverWalletId == walletId, ct);

    public async Task<IEnumerable<AdminTransactionItem>> GetAllEnrichedAsync(
        int page, int pageSize, string? status, CancellationToken ct)
    {
        var query = _context.Transactions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == Enum.Parse<TransactionStatus>(status, true));

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var walletIds = transactions.Select(t => t.SenderWalletId)
            .Concat(transactions.Select(t => t.ReceiverWalletId))
            .Distinct();

        var walletNameMap = await _context.Wallets
            .Where(w => walletIds.Contains(w.Id))
            .Join(_context.Users, 
                  w => w.UserId, 
                  u => u.Id, 
                  (w, u) => new { w.Id, u.FullName })
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        return transactions.Select(t => new AdminTransactionItem(
            t.Id,
            t.IdempotencyKey,
            t.Amount,
            t.Currency,
            t.Type.ToString(),
            t.Status.ToString(),
            t.SenderWalletId,
            walletNameMap.GetValueOrDefault(t.SenderWalletId, "System"),
            t.ReceiverWalletId,
            walletNameMap.GetValueOrDefault(t.ReceiverWalletId, "System"),
            t.Description,
            t.FailureReason,
            t.CreatedAt,
            t.CompletedAt
        ));
    }

    public async Task<int> CountAllAsync(string? status, CancellationToken ct)
    {
        var query = _context.Transactions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == Enum.Parse<TransactionStatus>(status, true));

        return await query.CountAsync(ct);
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