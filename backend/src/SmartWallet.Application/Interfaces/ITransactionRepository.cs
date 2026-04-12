using SmartWallet.Domain.Entities;
using SmartWallet.Application.Common;

namespace SmartWallet.Application.Interfaces;

public interface ITransactionRepository
{
    Task<Transaction?> FindByIdempotencyKeyAsync(Guid key, CancellationToken ct);
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<TransactionHistoryItem>> GetByWalletIdEnrichedAsync(Guid walletId, int page, int pageSize, CancellationToken ct);
    Task<int> CountByWalletIdAsync(Guid walletId, CancellationToken ct);
    Task<IEnumerable<AdminTransactionItem>> GetAllEnrichedAsync(int page, int pageSize, string? status, CancellationToken ct);
    Task<int> CountAllAsync(string? status, CancellationToken ct);
    Task<IEnumerable<SuspiciousActivityFlag>> GetSuspiciousActivityAsync(CancellationToken ct);
    Task AddAsync(Transaction transaction, CancellationToken ct);
    void Update(Transaction transaction);
}

public record SuspiciousActivityFlag(
    Guid     WalletId,
    string   Reason,
    int      TransactionCount,
    decimal  TotalAmount,
    DateTime DetectedAt
);