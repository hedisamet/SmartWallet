using Microsoft.EntityFrameworkCore.Storage;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext      _context;
    private IDbContextTransaction?     _transaction;

    public UnitOfWork(AppDbContext context) => _context = context;

    public async Task BeginTransactionAsync(CancellationToken ct)
    {
        _transaction = await _context.Database
            .BeginTransactionAsync(ct);
    }

    public async Task CommitAsync(CancellationToken ct)
    {
        await _context.SaveChangesAsync(ct);
        await _transaction!.CommitAsync(ct);
    }

    public async Task RollbackAsync(CancellationToken ct)
    {
        if (_transaction is not null)
            await _transaction.RollbackAsync(ct);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct)
        => await _context.SaveChangesAsync(ct);
}