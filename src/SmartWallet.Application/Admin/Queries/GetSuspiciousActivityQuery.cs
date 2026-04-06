using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Admin.Queries;

public record GetSuspiciousActivityQuery : IRequest<Result<List<SuspiciousActivityReport>>>;

public record SuspiciousActivityReport(
    Guid             WalletId,
    Guid             UserId,
    string           Email,
    string           RuleTriggered,
    string           Detail,
    decimal          CurrentBalance,
    DateTime         DetectedAt
);

public class GetSuspiciousActivityQueryHandler
    : IRequestHandler<GetSuspiciousActivityQuery, Result<List<SuspiciousActivityReport>>>
{
    private readonly ITransactionRepository _transactionRepo;
    private readonly IUserRepository        _userRepo;
    private readonly IWalletRepository      _walletRepo;

    // Detection thresholds
    private const int    HighFrequencyCount    = 10;   // more than 10 transfers in 1 hour
    private const decimal LargeAmountThreshold = 5000m; // single transfer over 5000 TND
    private const int    RapidSuccessionCount  = 5;    // 5 transfers within 5 minutes
    private const decimal RoundAmountThreshold = 1000m; // repeated round amounts (structuring)

    public GetSuspiciousActivityQueryHandler(
        ITransactionRepository transactionRepo,
        IUserRepository        userRepo,
        IWalletRepository      walletRepo)
    {
        _transactionRepo = transactionRepo;
        _userRepo        = userRepo;
        _walletRepo      = walletRepo;
    }

    public async Task<Result<List<SuspiciousActivityReport>>> Handle(
        GetSuspiciousActivityQuery query,
        CancellationToken          ct)
    {
        var reports  = new List<SuspiciousActivityReport>();
        var since    = DateTime.UtcNow.AddDays(-7); // look at last 7 days
        var allTx    = await _transactionRepo.GetRecentAsync(since, ct);

        // Group by sender wallet
        var bySender = allTx
            .Where(t => t.Type == TransactionType.Transfer)
            .GroupBy(t => t.SenderWalletId);

        foreach (var group in bySender)
        {
            var walletId     = group.Key;
            var transactions = group.OrderBy(t => t.CreatedAt).ToList();

            // RULE 1 — High frequency: more than 10 transfers in any 1-hour window
            var highFreq = DetectHighFrequency(transactions);
            if (highFreq is not null)
            {
                var report = await BuildReport(walletId, "HIGH_FREQUENCY", highFreq, ct);
                if (report is not null) reports.Add(report);
            }

            // RULE 2 — Large single transfer
            var largeTx = transactions
                .FirstOrDefault(t => t.Amount >= LargeAmountThreshold
                                  && t.Status == TransactionStatus.Success);
            if (largeTx is not null)
            {
                var report = await BuildReport(walletId, "LARGE_TRANSFER",
                    $"Single transfer of {largeTx.Amount} {largeTx.Currency} detected.", ct);
                if (report is not null) reports.Add(report);
            }

            // RULE 3 — Rapid succession: 5+ transfers within 5 minutes
            var rapidDetail = DetectRapidSuccession(transactions);
            if (rapidDetail is not null)
            {
                var report = await BuildReport(walletId, "RAPID_SUCCESSION", rapidDetail, ct);
                if (report is not null) reports.Add(report);
            }

            // RULE 4 — Structuring: multiple transfers of the same round amount
            var structuringDetail = DetectStructuring(transactions);
            if (structuringDetail is not null)
            {
                var report = await BuildReport(walletId, "STRUCTURING", structuringDetail, ct);
                if (report is not null) reports.Add(report);
            }
        }

        return Result<List<SuspiciousActivityReport>>.Success(
            reports.DistinctBy(r => new { r.WalletId, r.RuleTriggered }).ToList()
        );
    }

    private static string? DetectHighFrequency(List<Transaction> transactions)
    {
        for (int i = 0; i < transactions.Count; i++)
        {
            var windowStart = transactions[i].CreatedAt;
            var windowEnd   = windowStart.AddHours(1);
            var count       = transactions
                .Count(t => t.CreatedAt >= windowStart && t.CreatedAt <= windowEnd);

            if (count > HighFrequencyCount)
                return $"{count} transfers within 1 hour starting {windowStart:HH:mm} UTC.";
        }
        return null;
    }

    private static string? DetectRapidSuccession(List<Transaction> transactions)
    {
        for (int i = 0; i < transactions.Count; i++)
        {
            var windowStart = transactions[i].CreatedAt;
            var windowEnd   = windowStart.AddMinutes(5);
            var count       = transactions
                .Count(t => t.CreatedAt >= windowStart && t.CreatedAt <= windowEnd);

            if (count >= RapidSuccessionCount)
                return $"{count} transfers within 5 minutes starting {windowStart:HH:mm} UTC.";
        }
        return null;
    }

    private static string? DetectStructuring(List<Transaction> transactions)
    {
        var roundAmounts = transactions
            .Where(t => t.Amount >= RoundAmountThreshold && t.Amount % 100 == 0)
            .GroupBy(t => t.Amount)
            .Where(g => g.Count() >= 3)
            .ToList();

        if (!roundAmounts.Any()) return null;

        var detail = string.Join(", ",
            roundAmounts.Select(g => $"{g.Count()}x {g.Key} TND"));

        return $"Repeated round-amount transfers detected: {detail}";
    }

    private async Task<SuspiciousActivityReport?> BuildReport(
        Guid   walletId,
        string rule,
        string detail,
        CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByIdAsync(walletId, ct);
        if (wallet is null) return null;

        var user = await _userRepo.GetByIdAsync(wallet.UserId, ct);
        if (user is null) return null;

        return new SuspiciousActivityReport(
            walletId,
            user.Id,
            user.Email,
            rule,
            detail,
            wallet.Balance,
            DateTime.UtcNow
        );
    }
}