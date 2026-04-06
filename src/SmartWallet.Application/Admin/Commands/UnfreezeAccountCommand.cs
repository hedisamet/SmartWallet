using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Commands;

public record UnfreezeAccountCommand(
    Guid TargetUserId
) : IRequest<Result<UnfreezeAccountResponse>>;

public record UnfreezeAccountResponse(
    Guid UserId,
    Guid WalletId,
    bool IsLocked
);

public class UnfreezeAccountCommandHandler
    : IRequestHandler<UnfreezeAccountCommand, Result<UnfreezeAccountResponse>>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork       _unitOfWork;

    public UnfreezeAccountCommandHandler(
        IWalletRepository walletRepo,
        IUnitOfWork       unitOfWork)
    {
        _walletRepo = walletRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UnfreezeAccountResponse>> Handle(
        UnfreezeAccountCommand command,
        CancellationToken      ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(command.TargetUserId, ct);

        if (wallet is null)
            return Result<UnfreezeAccountResponse>.Failure("Wallet not found.");

        wallet.Unlock();
        _walletRepo.Update(wallet);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<UnfreezeAccountResponse>.Success(new UnfreezeAccountResponse(
            command.TargetUserId,
            wallet.Id,
            wallet.IsLocked
        ));
    }
}