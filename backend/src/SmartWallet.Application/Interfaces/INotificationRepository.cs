using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(Notification notification, CancellationToken ct);
    Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId, int count, CancellationToken ct);
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct);
    void Update(Notification notification);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct);
}
