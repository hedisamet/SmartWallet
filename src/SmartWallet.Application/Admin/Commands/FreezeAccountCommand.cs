using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Commands;

public record FreezeAccountCommand(
    Guid   TargetUserId,
    string Reason
) : IRequest<Result<FreezeAccountResponse>>;

public record FreezeAccountResponse(
    Guid   UserId,
    Guid   WalletId,
    string Reason,
    DateTime FrozenAt
);

public class FreezeAccountCommandHandler
    : IRequestHandler<FreezeAccountCommand, Result<FreezeAccountResponse>>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUserRepository   _userRepo;
    private readonly IUnitOfWork       _unitOfWork;

    public FreezeAccountCommandHandler(
        IWalletRepository walletRepo,
        IUserRepository   userRepo,
        IUnitOfWork       unitOfWork)
    {
        _walletRepo = walletRepo;
        _userRepo   = userRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<FreezeAccountResponse>> Handle(
        FreezeAccountCommand command,
        CancellationToken    ct)
    {
        var user = await _userRepo.GetByIdAsync(command.TargetUserId, ct);
        if (user is null)
            return Result<FreezeAccountResponse>.Failure("User not found.");

        var wallet = await _walletRepo.GetByUserIdAsync(command.TargetUserId, ct);
        if (wallet is null)
            return Result<FreezeAccountResponse>.Failure("Wallet not found.");

        if (wallet.IsLocked)
            return Result<FreezeAccountResponse>.Failure("Account is already frozen.");

        wallet.Lock(command.Reason);

        await _unitOfWork.SaveChangesAsync(ct);

        return Result<FreezeAccountResponse>.Success(new FreezeAccountResponse(
            user.Id,
            wallet.Id,
            command.Reason,
            DateTime.UtcNow
        ));
    }
}