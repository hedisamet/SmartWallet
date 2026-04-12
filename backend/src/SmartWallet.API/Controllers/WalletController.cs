using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Transfers.Queries;
using SmartWallet.Application.Wallets.Commands;
using SmartWallet.Application.Wallets.Queries;

namespace SmartWallet.API.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IMediator           _mediator;
    private readonly ICurrentUserService _currentUser;

    public WalletController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance(CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetBalanceQuery(_currentUser.UserId), ct);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit(
        [FromBody]  DepositRequest request,
        [FromHeader(Name = "Idempotency-Key")] Guid? idempotencyKey,
        CancellationToken ct)
    {
        var key = idempotencyKey ?? Guid.NewGuid();

        var result = await _mediator.Send(new DepositCommand(
            UserId         : _currentUser.UserId,
            Amount         : request.Amount,
            Currency       : request.Currency,
            IdempotencyKey : key
        ), ct);

        if (!result.IsSuccess)
            return UnprocessableEntity(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct     = default)
    {
        if (pageSize > 100) pageSize = 100;

        var result = await _mediator.Send(
            new GetTransactionHistoryQuery(_currentUser.UserId, page, pageSize), ct);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpGet("transactions/{id:guid}")]
    public async Task<IActionResult> GetTransactionById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTransactionByIdQuery(id), ct);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }
}

public record DepositRequest(decimal Amount, string Currency);