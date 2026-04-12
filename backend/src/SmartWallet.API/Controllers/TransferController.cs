using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Transfers.Commands;

namespace SmartWallet.API.Controllers;

[ApiController]
[Route("api/v1/transfers")]
[Authorize]
public class TransferController : ControllerBase
{
    private readonly IMediator           _mediator;
    private readonly ICurrentUserService _currentUser;

    public TransferController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Transfer(
        [FromBody]  TransferRequest request,
        [FromHeader(Name = "Idempotency-Key")] Guid? idempotencyKey,
        CancellationToken cancellationToken)
    {
        var key = idempotencyKey ?? Guid.NewGuid();

        var command = new TransferCommand(
            SenderId         : _currentUser.UserId,
            ReceiverWalletId : request.ReceiverWalletId,
            Amount           : request.Amount,
            Currency         : request.Currency,
            IdempotencyKey   : key,
            Description      : request.Description
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return UnprocessableEntity(new { error = result.Error });

        return Ok(result.Value);
    }
}

public record TransferRequest(
    Guid    ReceiverWalletId,
    decimal Amount,
    string  Currency,
    string? Description
);