using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWallet.Application.Admin.Commands;
using SmartWallet.Application.Admin.Queries;

namespace SmartWallet.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator) => _mediator = mediator;

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct     = default)
    {
        var result = await _mediator.Send(
            new GetAllUsersQuery(page, pageSize), ct);

        return Ok(result.Value);
    }

    [HttpPost("users/{userId}/freeze")]
    public async Task<IActionResult> FreezeAccount(
        Guid               userId,
        [FromBody]         FreezeRequest request,
        CancellationToken  ct = default)
    {
        var result = await _mediator.Send(
            new FreezeAccountCommand(userId, request.Reason), ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("users/{userId}/unfreeze")]
    public async Task<IActionResult> UnfreezeAccount(
        Guid              userId,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new UnfreezeAccountCommand(userId), ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetAllTransactions(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? status   = null,
        CancellationToken   ct       = default)
    {
        var result = await _mediator.Send(
            new GetAllTransactionsQuery(page, pageSize, status), ct);

        return Ok(result.Value);
    }

    [HttpGet("suspicious")]
    public async Task<IActionResult> GetSuspiciousActivity(CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetSuspiciousActivityQuery(), ct);
        return Ok(result.Value);
    }
}

public record FreezeRequest(string Reason);