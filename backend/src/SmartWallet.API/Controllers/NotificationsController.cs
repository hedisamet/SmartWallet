using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Notifications.Queries;

namespace SmartWallet.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationRepository _notificationRepo;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationsController(
        IMediator mediator, 
        ICurrentUserService currentUser,
        INotificationRepository notificationRepo,
        IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _notificationRepo = notificationRepo;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int count = 20)
    {
        var result = await _mediator.Send(new GetNotificationsQuery(_currentUser.UserId, count));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var n = await _notificationRepo.GetByIdAsync(id, HttpContext.RequestAborted);
        if (n == null || n.UserId != _currentUser.UserId) return NotFound();

        n.MarkAsRead();
        _notificationRepo.Update(n);
        await _unitOfWork.SaveChangesAsync(HttpContext.RequestAborted);

        return NoContent();
    }
}
