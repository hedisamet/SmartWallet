using Microsoft.EntityFrameworkCore;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context) => _context = context;

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
        => await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant().Trim(), ct);

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Users.FindAsync(new object[] { id }, ct);

    public async Task<IEnumerable<User>> GetAllAsync(int page, int pageSize, CancellationToken ct)
        => await _context.Users
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task AddAsync(User user, CancellationToken ct)
        => await _context.Users.AddAsync(user, ct);

    public bool ExistsByEmail(string email)
        => _context.Users.Any(u => u.Email == email.ToLowerInvariant().Trim());
}