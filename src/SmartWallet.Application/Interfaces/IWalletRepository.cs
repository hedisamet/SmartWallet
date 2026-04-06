using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Wallet?> GetByUserIdAsync(Guid userId, CancellationToken ct);
    Task<Wallet?> GetByIdWithLockAsync(Guid id, CancellationToken ct);
    Task AddAsync(Wallet wallet, CancellationToken ct);
    Task<Wallet?> GetByUserIdWithLockAsync(Guid userId, CancellationToken ct);
    void Update(Wallet wallet);
}