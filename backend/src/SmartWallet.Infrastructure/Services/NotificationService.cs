using Microsoft.AspNetCore.SignalR;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Infrastructure.Hubs;
using SmartWallet.Infrastructure.Persistence;

namespace SmartWallet.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepo;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        INotificationRepository notificationRepo,
        IHubContext<NotificationHub> hubContext)
    {
        _notificationRepo = notificationRepo;
        _hubContext = hubContext;
    }

    public async Task NotifyUserAsync(Guid userId, string title, string message, CancellationToken ct)
    {
        var notification = Notification.Create(userId, title, message);
        await _notificationRepo.AddAsync(notification, ct);
        
        // Push real-time event
        await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new
        {
            notification.Id,
            notification.Title,
            notification.Message,
            notification.IsRead,
            notification.CreatedAt
        }, ct);
    }
}
