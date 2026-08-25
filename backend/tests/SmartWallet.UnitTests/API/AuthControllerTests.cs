using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartWallet.API.Controllers;
using SmartWallet.Application.Auth.Commands;
using SmartWallet.Application.Common;
using Xunit;

namespace SmartWallet.UnitTests.API;

public class AuthControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _controller = new AuthController(_mediator.Object);
    }

    [Fact]
    public async Task Register_ReturnsOk_WhenSuccess()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "Password123!");
        var response = Guid.NewGuid(); // Assuming Register returns GUID user ID

        _mediator.Setup(m => m.Send(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(Result<Guid>.Success(response));

        var result = await _controller.Register(request, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task Login_ReturnsOk_WithToken()
    {
        var request = new LoginRequest("test@example.com", "Password123!");
        var response = new LoginResponse("token_here", "Test User", "User");

        _mediator.Setup(m => m.Send(It.IsAny<LoginCommand>(), default))
            .ReturnsAsync(Result<LoginResponse>.Success(response));

        var result = await _controller.Login(request, default);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_WhenInvalid()
    {
        var request = new LoginRequest("test@example.com", "wrong");
        _mediator.Setup(m => m.Send(It.IsAny<LoginCommand>(), default))
            .ReturnsAsync(Result<LoginResponse>.Failure("Invalid credentials"));

        var result = await _controller.Login(request, default);

        var authResult = Assert.IsType<UnauthorizedObjectResult>(result);
    }
}
