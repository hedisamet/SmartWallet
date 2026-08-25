using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartWallet.API.Controllers;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Transfers.Commands;
using Xunit;

namespace SmartWallet.UnitTests.API;

public class TransferControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly TransferController _controller;
    private readonly Guid _senderId = Guid.NewGuid();

    public TransferControllerTests()
    {
        _currentUser.Setup(u => u.UserId).Returns(_senderId);
        _controller = new TransferController(_mediator.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Transfer_ReturnsOk_WhenSuccessful()
    {
        var request = new TransferRequest(Guid.NewGuid(), 100m, "TND", "Gift");
        var response = new TransferResponse(Guid.NewGuid(), "Success", DateTime.UtcNow);

        _mediator.Setup(m => m.Send(It.IsAny<TransferCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<TransferResponse>.Success(response));

        var result = await _controller.Transfer(request, null, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task Transfer_ReturnsUnprocessableEntity_WhenFailure()
    {
        var request = new TransferRequest(Guid.NewGuid(), 100m, "TND", "Gift");
        _mediator.Setup(m => m.Send(It.IsAny<TransferCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<TransferResponse>.Failure("Insufficient funds"));

        var result = await _controller.Transfer(request, null, default);

        var failResult = Assert.IsType<UnprocessableEntityObjectResult>(result);
    }
}
