using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Transfers.Queries;

public record GetTransactionHistoryQuery(
    Guid UserId,
    int  Page     = 1,
    int  PageSize = 20
) : IRequest<Result<PagedResult<TransactionHistoryItem>>>;

public class GetTransactionHistoryQueryHandler
    : IRequestHandler<GetTransactionHistoryQuery, Result<PagedResult<TransactionHistoryItem>>>
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

    public async Task<Result<PagedResult<TransactionHistoryItem>>> Handle(
        GetTransactionHistoryQuery query,
        CancellationToken          ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.UserId, ct);

        if (wallet is null)
            return Result<PagedResult<TransactionHistoryItem>>.Failure("Wallet not found.");

        var items = await _transactionRepo.GetByWalletIdEnrichedAsync(
            wallet.Id, query.Page, query.PageSize, ct);

        var totalCount = await _transactionRepo.CountByWalletIdAsync(wallet.Id, ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize);

        var itemsList = items.ToList();

        var pagedResult = new PagedResult<TransactionHistoryItem>(
            itemsList, totalCount, query.Page, query.PageSize, totalPages);

        return Result<PagedResult<TransactionHistoryItem>>.Success(pagedResult);
    }
}