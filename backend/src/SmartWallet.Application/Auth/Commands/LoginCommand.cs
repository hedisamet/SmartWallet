using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Auth.Commands;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<Result<LoginResponse>>;

public record LoginResponse(
    string Token,
    string Email,
    string FullName,
    string Role
);

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    private readonly IUserRepository _userRepo;
    private readonly IJwtService     _jwtService;

    public LoginCommandHandler(IUserRepository userRepo, IJwtService jwtService)
    {
        _userRepo   = userRepo;
        _jwtService = jwtService;
    }

    public async Task<Result<LoginResponse>> Handle(
        LoginCommand      command,
        CancellationToken ct)
    {
        var user = await _userRepo.GetByEmailAsync(command.Email, ct);

        // Same error message for both "not found" and "wrong password"
        // Never tell the caller which one failed — that leaks user enumeration info
        if (user is null || !BCrypt.Net.BCrypt.Verify(command.Password, user.PasswordHash))
            return Result<LoginResponse>.Failure("Invalid email or password.");

        if (!user.IsActive)
            return Result<LoginResponse>.Failure("Account is inactive.");

        var token = _jwtService.GenerateToken(user);

        return Result<LoginResponse>.Success(new LoginResponse(
            token,
            user.Email,
            user.FullName,
            user.Role
        ));
    }
}