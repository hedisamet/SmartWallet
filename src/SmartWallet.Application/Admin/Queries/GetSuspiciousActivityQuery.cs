using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Queries;

public record GetSuspiciousActivityQuery : IRequest<Result<List<SuspiciousActivityItem>>>;

public record SuspiciousActivityItem(
    Guid    WalletId,
    Guid    UserId,
    string  Email,
    string  Reason,
    int     TransactionCount,
    decimal TotalAmount,
    DateTime DetectedAt
);

public class GetSuspiciousActivityQueryHandler
    : IRequestHandler<GetSuspiciousActivityQuery, Result<List<SuspiciousActivityItem>>>
{
    private readonly ITransactionRepository _transactionRepo;
    private readonly IUserRepository        _userRepo;
    private readonly IWalletRepository      _walletRepo;

    public GetSuspiciousActivityQueryHandler(
        ITransactionRepository transactionRepo,
        IUserRepository        userRepo,
        IWalletRepository      walletRepo)
    {
        _transactionRepo = transactionRepo;
        _userRepo        = userRepo;
        _walletRepo      = walletRepo;
    }

    public async Task<Result<List<SuspiciousActivityItem>>> Handle(
        GetSuspiciousActivityQuery query,
        CancellationToken          ct)
    {
        var flags = await _transactionRepo.GetSuspiciousActivityAsync(ct);
        var result = new List<SuspiciousActivityItem>();

        foreach (var flag in flags)
        {
            var wallet = await _walletRepo.GetByIdAsync(flag.WalletId, ct);
            if (wallet is null) continue;

            var user = await _userRepo.GetByIdAsync(wallet.UserId, ct);
            if (user is null) continue;

            result.Add(new SuspiciousActivityItem(
                flag.WalletId,
                user.Id,
                user.Email,
                flag.Reason,
                flag.TransactionCount,
                flag.TotalAmount,
                flag.DetectedAt
            ));
        }

        return Result<List<SuspiciousActivityItem>>.Success(result);
    }
}