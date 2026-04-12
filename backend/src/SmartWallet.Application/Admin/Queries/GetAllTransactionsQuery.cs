using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Queries;

public record GetAllTransactionsQuery(
    int      Page       = 1,
    int      PageSize   = 20,
    string?  Status     = null
) : IRequest<Result<List<AdminTransactionItem>>>;



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
            .GetAllEnrichedAsync(query.Page, query.PageSize, query.Status, ct);

        return Result<List<AdminTransactionItem>>.Success(transactions.ToList());
    }
}