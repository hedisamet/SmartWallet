using Microsoft.EntityFrameworkCore;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(Notification notification, CancellationToken ct)
        => await _context.Notifications.AddAsync(notification, ct);

    public async Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId, int count, CancellationToken ct)
        => await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(count)
            .ToListAsync(ct);

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Notifications.FindAsync(new object[] { id }, ct);

    public void Update(Notification notification)
        => _context.Notifications.Update(notification);

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct)
        => await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);
}
