using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Commands;

public record UnfreezeAccountCommand(Guid TargetUserId)
    : IRequest<Result<UnfreezeAccountResponse>>;

public record UnfreezeAccountResponse(
    Guid     UserId,
    Guid     WalletId,
    DateTime UnfrozenAt
);

public class UnfreezeAccountCommandHandler
    : IRequestHandler<UnfreezeAccountCommand, Result<UnfreezeAccountResponse>>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUserRepository   _userRepo;
    private readonly IUnitOfWork       _unitOfWork;

    public UnfreezeAccountCommandHandler(
        IWalletRepository walletRepo,
        IUserRepository   userRepo,
        IUnitOfWork       unitOfWork)
    {
        _walletRepo = walletRepo;
        _userRepo   = userRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UnfreezeAccountResponse>> Handle(
        UnfreezeAccountCommand command,
        CancellationToken      ct)
    {
        var user = await _userRepo.GetByIdAsync(command.TargetUserId, ct);
        if (user is null)
            return Result<UnfreezeAccountResponse>.Failure("User not found.");

        var wallet = await _walletRepo.GetByUserIdAsync(command.TargetUserId, ct);
        if (wallet is null)
            return Result<UnfreezeAccountResponse>.Failure("Wallet not found.");

        wallet.Unlock();

        await _unitOfWork.SaveChangesAsync(ct);

        return Result<UnfreezeAccountResponse>.Success(new UnfreezeAccountResponse(
            user.Id,
            wallet.Id,
            DateTime.UtcNow
        ));
    }
}