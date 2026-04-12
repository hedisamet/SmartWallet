using Microsoft.EntityFrameworkCore;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly AppDbContext _context;

    public WalletRepository(AppDbContext context) => _context = context;

    public async Task<Wallet?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Wallets.FindAsync(new object[] { id }, ct);

    public async Task<Wallet?> GetByUserIdAsync(Guid userId, CancellationToken ct)
        => await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);

    public async Task<Wallet?> GetByIdWithLockAsync(Guid id, CancellationToken ct)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "SELECT 1 FROM wallets WHERE id = {0} FOR UPDATE", id);

        return await _context.Wallets
            .FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<Wallet?> GetByUserIdWithLockAsync(Guid userId, CancellationToken ct)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "SELECT 1 FROM wallets WHERE user_id = {0} FOR UPDATE", userId);

        return await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);
    }

    public async Task AddAsync(Wallet wallet, CancellationToken ct)
        => await _context.Wallets.AddAsync(wallet, ct);

    public void Update(Wallet wallet)
    {
        // Entity was fetched through EF change tracker — no explicit Update needed.
        // EF detects changes automatically on SaveChanges.
        // Calling Update() on a tracked entity marks ALL properties as modified
        // which triggers EF's internal concurrency check and causes false conflicts.
        var entry = _context.Entry(wallet);
        if (entry.State == Microsoft.EntityFrameworkCore.EntityState.Detached)
            _context.Wallets.Update(wallet);
        // If already tracked, do nothing — EF will detect changes on its own
    }
}