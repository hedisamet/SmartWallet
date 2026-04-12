using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Notifications.Queries;

public record GetNotificationsQuery(Guid UserId, int Count = 20) : IRequest<Result<IEnumerable<NotificationDto>>>;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, Result<IEnumerable<NotificationDto>>>
{
    private readonly INotificationRepository _notificationRepo;

    public GetNotificationsQueryHandler(INotificationRepository notificationRepo)
    {
        _notificationRepo = notificationRepo;
    }

    public async Task<Result<IEnumerable<NotificationDto>>> Handle(
        GetNotificationsQuery query,
        CancellationToken     ct)
    {
        var notifications = await _notificationRepo.GetByUserIdAsync(query.UserId, query.Count, ct);

        var dtos = notifications.Select(n => new NotificationDto(
            n.Id,
            n.Title,
            n.Message,
            n.IsRead,
            n.CreatedAt
        ));

        return Result<IEnumerable<NotificationDto>>.Success(dtos);
    }
}
