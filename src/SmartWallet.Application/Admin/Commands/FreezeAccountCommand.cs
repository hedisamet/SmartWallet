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
    bool   IsLocked,
    string Reason
);

public class FreezeAccountCommandHandler
    : IRequestHandler<FreezeAccountCommand, Result<FreezeAccountResponse>>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork       _unitOfWork;

    public FreezeAccountCommandHandler(
        IWalletRepository walletRepo,
        IUnitOfWork       unitOfWork)
    {
        _walletRepo = walletRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<FreezeAccountResponse>> Handle(
        FreezeAccountCommand command,
        CancellationToken    ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(command.TargetUserId, ct);

        if (wallet is null)
            return Result<FreezeAccountResponse>.Failure("Wallet not found.");

        wallet.Lock(command.Reason);
        _walletRepo.Update(wallet);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<FreezeAccountResponse>.Success(new FreezeAccountResponse(
            command.TargetUserId,
            wallet.Id,
            wallet.IsLocked,
            command.Reason
        ));
    }
}