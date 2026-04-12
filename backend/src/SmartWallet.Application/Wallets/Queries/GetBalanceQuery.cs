using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Wallets.Queries;

public record GetBalanceQuery(Guid UserId) : IRequest<Result<BalanceResponse>>;

public record BalanceResponse(
    Guid    WalletId,
    decimal Balance,
    string  Currency,
    bool    IsLocked
);

public class GetBalanceQueryHandler : IRequestHandler<GetBalanceQuery, Result<BalanceResponse>>
{
    private readonly IWalletRepository _walletRepo;

    public GetBalanceQueryHandler(IWalletRepository walletRepo)
        => _walletRepo = walletRepo;

    public async Task<Result<BalanceResponse>> Handle(
        GetBalanceQuery   query,
        CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.UserId, ct);

        if (wallet is null)
            return Result<BalanceResponse>.Failure("Wallet not found.");

        return Result<BalanceResponse>.Success(new BalanceResponse(
            wallet.Id,
            wallet.Balance,
            wallet.Currency.Code,
            wallet.IsLocked
        ));
    }
}