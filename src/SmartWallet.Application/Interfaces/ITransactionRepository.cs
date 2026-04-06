using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Interfaces;

public interface ITransactionRepository
{
    Task<Transaction?> FindByIdempotencyKeyAsync(Guid key, CancellationToken ct);
    Task<IEnumerable<Transaction>> GetByWalletIdAsync(Guid walletId, int page, int pageSize, CancellationToken ct);
    Task<IEnumerable<Transaction>> GetAllAsync(int page, int pageSize, string? status, CancellationToken ct);
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