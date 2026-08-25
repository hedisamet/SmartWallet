using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartWallet.API.Controllers;
using SmartWallet.Application.Admin.Commands;
using SmartWallet.Application.Admin.Queries;
using SmartWallet.Application.Common;
using Xunit;

namespace SmartWallet.UnitTests.API;

public class AdminControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly AdminController _controller;

    public AdminControllerTests()
    {
        _controller = new AdminController(_mediator.Object);
    }

    [Fact]
    public async Task GetAllUsers_ReturnsOk_WithPaginatedData()
    {
        var response = new PaginatedList<UserDto>(new List<UserDto>(), 0, 1, 20);
        _mediator.Setup(m => m.Send(It.IsAny<GetAllUsersQuery>(), default))
            .ReturnsAsync(Result<PaginatedList<UserDto>>.Success(response));

        var result = await _controller.GetAllUsers(1, 20, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task FreezeAccount_ReturnsOk_OnSuccess()
    {
        var userId = Guid.NewGuid();
        var request = new FreezeRequest("Suspicious activity");
        
        _mediator.Setup(m => m.Send(It.Is<FreezeAccountCommand>(c => c.UserId == userId), default))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));

        var result = await _controller.FreezeAccount(userId, request, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSuspiciousActivity_ReturnsOk_WithResults()
    {
        var response = new List<SuspiciousActivityDto>();
        _mediator.Setup(m => m.Send(It.IsAny<GetSuspiciousActivityQuery>(), default))
            .ReturnsAsync(Result<List<SuspiciousActivityDto>>.Success(response));

        var result = await _controller.GetSuspiciousActivity(default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }
}
