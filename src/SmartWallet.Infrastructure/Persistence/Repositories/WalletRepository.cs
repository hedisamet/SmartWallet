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

    // FOR UPDATE acquires a row-level exclusive lock in PostgreSQL.
    // Any concurrent request trying to lock the same row will BLOCK
    // until this transaction commits or rolls back.
    // This eliminates the race condition where two requests both read
    // balance=500, both pass the check, both debit 400, leaving -300.
    public async Task<Wallet?> GetByIdWithLockAsync(Guid id, CancellationToken ct)
        => await _context.Wallets
            .FromSqlRaw("SELECT * FROM wallets WHERE id = {0} FOR UPDATE", id)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(Wallet wallet, CancellationToken ct)
        => await _context.Wallets.AddAsync(wallet, ct);

    public void Update(Wallet wallet)
        => _context.Wallets.Update(wallet);
}