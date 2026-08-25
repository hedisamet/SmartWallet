using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartWallet.API.Controllers;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Notifications.Commands;
using SmartWallet.Application.Notifications.Queries;
using SmartWallet.Domain.Entities;
using Xunit;

namespace SmartWallet.UnitTests.API;

public class NotificationsControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly NotificationsController _controller;
    private readonly Guid _userId = Guid.NewGuid();

    public NotificationsControllerTests()
    {
        _currentUser.Setup(u => u.UserId).Returns(_userId);
        _controller = new NotificationsController(_mediator.Object, _currentUser.Object);
    }

    [Fact]
    public async Task GetNotifications_ReturnsOk_WithData()
    {
        var notifications = new List<NotificationDto> { 
            new NotificationDto(Guid.NewGuid(), "Title", "Msg", false, DateTime.UtcNow) 
        };
        
        _mediator.Setup(m => m.Send(It.Is<GetNotificationsQuery>(q => q.UserId == _userId), default))
            .ReturnsAsync(Result<List<NotificationDto>>.Success(notifications));

        var result = await _controller.GetNotifications(10, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(notifications, okResult.Value);
    }

    [Fact]
    public async Task MarkAsRead_ReturnsOk_OnSuccess()
    {
        var notifId = Guid.NewGuid();
        _mediator.Setup(m => m.Send(It.Is<MarkNotificationAsReadCommand>(c => c.NotificationId == notifId), default))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));

        var result = await _controller.MarkAsRead(notifId, default);

        Assert.IsType<OkResult>(result);
    }
}
