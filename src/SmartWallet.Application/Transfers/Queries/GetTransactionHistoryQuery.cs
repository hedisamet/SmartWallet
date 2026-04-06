using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Transfers.Queries;

public record GetTransactionHistoryQuery(
    Guid UserId,
    int  Page     = 1,
    int  PageSize = 20
) : IRequest<Result<List<TransactionHistoryItem>>>;

public record TransactionHistoryItem(
    Guid      TransactionId,
    decimal   Amount,
    string    Currency,
    string    Type,
    string    Status,
    Guid      SenderWalletId,
    Guid      ReceiverWalletId,
    string?   Description,
    DateTime  CreatedAt,
    DateTime? CompletedAt
);

public class GetTransactionHistoryQueryHandler
    : IRequestHandler<GetTransactionHistoryQuery, Result<List<TransactionHistoryItem>>>
{
    private readonly IWalletRepository      _walletRepo;
    private readonly ITransactionRepository _transactionRepo;

    public GetTransactionHistoryQueryHandler(
        IWalletRepository      walletRepo,
        ITransactionRepository transactionRepo)
    {
        _walletRepo      = walletRepo;
        _transactionRepo = transactionRepo;
    }

    public async Task<Result<List<TransactionHistoryItem>>> Handle(
        GetTransactionHistoryQuery query,
        CancellationToken          ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.UserId, ct);

        if (wallet is null)
            return Result<List<TransactionHistoryItem>>.Failure("Wallet not found.");

        var transactions = await _transactionRepo.GetByWalletIdAsync(
            wallet.Id, query.Page, query.PageSize, ct);

        var result = transactions.Select(t => new TransactionHistoryItem(
            t.Id,
            t.Amount,
            t.Currency,
            t.Type.ToString(),
            t.Status.ToString(),
            t.SenderWalletId,
            t.ReceiverWalletId,
            t.Description,
            t.CreatedAt,
            t.CompletedAt
        )).ToList();

        return Result<List<TransactionHistoryItem>>.Success(result);
    }
}