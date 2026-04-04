using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Interfaces;

public interface ITransactionRepository
{
    Task<Transaction?> FindByIdempotencyKeyAsync(Guid key, CancellationToken ct);
    Task<IEnumerable<Transaction>> GetByWalletIdAsync(Guid walletId, int page, int pageSize, CancellationToken ct);
    Task AddAsync(Transaction transaction, CancellationToken ct);
    void Update(Transaction transaction);
}