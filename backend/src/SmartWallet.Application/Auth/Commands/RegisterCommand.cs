using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.Application.Auth.Commands;

public record RegisterCommand(
    string FullName,
    string Email,
    string Password
) : IRequest<Result<RegisterResponse>>;

public record RegisterResponse(
    Guid   UserId,
    string Email,
    string FullName
);

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly IUserRepository   _userRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork       _unitOfWork;

    public RegisterCommandHandler(
        IUserRepository   userRepo,
        IWalletRepository walletRepo,
        IUnitOfWork       unitOfWork)
    {
        _userRepo   = userRepo;
        _walletRepo = walletRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RegisterResponse>> Handle(
        RegisterCommand   command,
        CancellationToken ct)
    {
        if (_userRepo.ExistsByEmail(command.Email))
            return Result<RegisterResponse>.Failure("Email already registered.");

        // Hash the password — BCrypt work factor 12 is the minimum for production
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(command.Password, workFactor: 12);

        var user = User.Create(command.Email, passwordHash, command.FullName);

        // Every new user automatically gets a TND wallet
        var wallet = Wallet.Create(user.Id, Currency.TND);

        await _userRepo.AddAsync(user, ct);
        await _walletRepo.AddAsync(wallet, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<RegisterResponse>.Success(new RegisterResponse(
            user.Id,
            user.Email,
            user.FullName
        ));
    }
}