using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Queries;

public record GetAllTransactionsQuery(
    int      Page       = 1,
    int      PageSize   = 20,
    string?  Status     = null
) : IRequest<Result<List<AdminTransactionItem>>>;

public record AdminTransactionItem(
    Guid      TransactionId,
    decimal   Amount,
    string    Currency,
    string    Type,
    string    Status,
    Guid      SenderWalletId,
    Guid      ReceiverWalletId,
    string?   Description,
    string?   FailureReason,
    DateTime  CreatedAt,
    DateTime? CompletedAt
);

public class GetAllTransactionsQueryHandler
    : IRequestHandler<GetAllTransactionsQuery, Result<List<AdminTransactionItem>>>
{
    private readonly ITransactionRepository _transactionRepo;

    public GetAllTransactionsQueryHandler(ITransactionRepository transactionRepo)
        => _transactionRepo = transactionRepo;

    public async Task<Result<List<AdminTransactionItem>>> Handle(
        GetAllTransactionsQuery query,
        CancellationToken       ct)
    {
        var transactions = await _transactionRepo
            .GetAllAsync(query.Page, query.PageSize, query.Status, ct);

        var result = transactions.Select(t => new AdminTransactionItem(
            t.Id,
            t.Amount,
            t.Currency,
            t.Type.ToString(),
            t.Status.ToString(),
            t.SenderWalletId,
            t.ReceiverWalletId,
            t.Description,
            t.FailureReason,
            t.CreatedAt,
            t.CompletedAt
        )).ToList();

        return Result<List<AdminTransactionItem>>.Success(result);
    }
}