using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.Application.Admin.Queries;

public record GetAllUsersQuery(
    int Page     = 1,
    int PageSize = 20
) : IRequest<Result<List<UserSummary>>>;

public record UserSummary(
    Guid    UserId,
    string  Email,
    string  FullName,
    string  Role,
    bool    IsActive,
    decimal Balance,
    bool    WalletLocked,
    DateTime CreatedAt
);

public class GetAllUsersQueryHandler
    : IRequestHandler<GetAllUsersQuery, Result<List<UserSummary>>>
{
    private readonly IUserRepository   _userRepo;
    private readonly IWalletRepository _walletRepo;

    public GetAllUsersQueryHandler(
        IUserRepository   userRepo,
        IWalletRepository walletRepo)
    {
        _userRepo   = userRepo;
        _walletRepo = walletRepo;
    }

    public async Task<Result<List<UserSummary>>> Handle(
        GetAllUsersQuery   query,
        CancellationToken  ct)
    {
        var users = await _userRepo.GetAllAsync(query.Page, query.PageSize, ct);

        var summaries = new List<UserSummary>();

        foreach (var user in users)
        {
            var wallet = await _walletRepo.GetByUserIdAsync(user.Id, ct);
            summaries.Add(new UserSummary(
                user.Id,
                user.Email,
                user.FullName,
                user.Role,
                user.IsActive,
                wallet?.Balance ?? 0m,
                wallet?.IsLocked ?? false,
                user.CreatedAt
            ));
        }

        return Result<List<UserSummary>>.Success(summaries);
    }
}