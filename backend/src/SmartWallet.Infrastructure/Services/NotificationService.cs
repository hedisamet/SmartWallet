using Microsoft.AspNetCore.SignalR;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Infrastructure.Hubs;

namespace SmartWallet.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepo;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        INotificationRepository notificationRepo,
        IHubContext<NotificationHub> hubContext,
        IUnitOfWork unitOfWork)
    {
        _notificationRepo = notificationRepo;
        _hubContext = hubContext;
        _unitOfWork = unitOfWork;
    }

    public async Task NotifyUserAsync(Guid userId, string title, string message, CancellationToken ct)
    {
        var notification = Notification.Create(userId, title, message);
        await _notificationRepo.AddAsync(notification, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        
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
