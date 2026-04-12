namespace SmartWallet.Application.Interfaces;

public interface INotificationService
{
    Task NotifyUserAsync(Guid userId, string title, string message, CancellationToken ct);
}
