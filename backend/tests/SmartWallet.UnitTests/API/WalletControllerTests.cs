using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartWallet.API.Controllers;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Wallets.Commands;
using SmartWallet.Application.Wallets.Queries;
using Xunit;

namespace SmartWallet.UnitTests.API;

public class WalletControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly WalletController _controller;
    private readonly Guid _userId = Guid.NewGuid();

    public WalletControllerTests()
    {
        _currentUser.Setup(u => u.UserId).Returns(_userId);
        _controller = new WalletController(_mediator.Object, _currentUser.Object);
    }

    [Fact]
    public async Task GetBalance_ReturnsOk_WhenSuccess()
    {
        var response = new BalanceResponse { Balance = 1000m, Currency = "TND" };
        _mediator.Setup(m => m.Send(It.Is<GetBalanceQuery>(q => q.UserId == _userId), default))
            .ReturnsAsync(Result<BalanceResponse>.Success(response));

        var result = await _controller.GetBalance(default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task GetBalance_ReturnsNotFound_WhenFailure()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetBalanceQuery>(), default))
            .ReturnsAsync(Result<BalanceResponse>.Failure("Not found"));

        var result = await _controller.GetBalance(default);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Deposit_ReturnsOk_WhenSuccess()
    {
        var request = new DepositRequest(500m, "TND");
        var response = new DepositResponse(Guid.NewGuid(), 1500m, "TND", DateTime.UtcNow);
        
        _mediator.Setup(m => m.Send(It.IsAny<DepositCommand>(), default))
            .ReturnsAsync(Result<DepositResponse>.Success(response));

        var result = await _controller.Deposit(request, null, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task GetTransactions_ReturnsOk_WithHistory()
    {
        var response = new PaginatedList<TransactionDto>(new List<TransactionDto>(), 0, 1, 20);
        _mediator.Setup(m => m.Send(It.IsAny<GetTransactionHistoryQuery>(), default))
            .ReturnsAsync(Result<PaginatedList<TransactionDto>>.Success(response));

        var result = await _controller.GetTransactions(1, 20, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }
}
