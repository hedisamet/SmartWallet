using Moq;
using SmartWallet.Application.Admin.Queries;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Application;

public class SuspiciousActivityTests
{
    private readonly Mock<ITransactionRepository> _transactionRepo = new();
    private readonly Mock<IUserRepository>        _userRepo        = new();
    private readonly Mock<IWalletRepository>      _walletRepo      = new();

    private GetSuspiciousActivityQueryHandler CreateHandler() => new(
        _transactionRepo.Object,
        _userRepo.Object,
        _walletRepo.Object);

    private static User CreateUser()
        => User.Create("flagged@test.com", "hash", "Flagged User");

    private static Wallet CreateWallet(Guid userId)
    {
        var w = Wallet.Create(userId, Currency.TND);
        w.ClearDomainEvents();
        return w;
    }

    [Fact]
    public async Task Handle_NoFlags_ReturnsEmptyList()
    {
        _transactionRepo.Setup(r => r.GetSuspiciousActivityAsync(default))
            .ReturnsAsync(new List<SuspiciousActivityFlag>());

        var result = await CreateHandler()
            .Handle(new GetSuspiciousActivityQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Handle_WithFlags_ReturnsEnrichedItems()
    {
        var user   = CreateUser();
        var wallet = CreateWallet(user.Id);

        var flags = new List<SuspiciousActivityFlag>
        {
            new(wallet.Id,
                "High frequency: more than 5 transfers in the last hour",
                TransactionCount : 7,
                TotalAmount      : 3500m,
                DetectedAt       : DateTime.UtcNow)
        };

        _transactionRepo.Setup(r => r.GetSuspiciousActivityAsync(default))
            .ReturnsAsync(flags);

        _walletRepo.Setup(r => r.GetByIdAsync(wallet.Id, default))
            .ReturnsAsync(wallet);

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);

        var result = await CreateHandler()
            .Handle(new GetSuspiciousActivityQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);

        var item = result.Value!.First();
        Assert.Equal(user.Id,        item.UserId);
        Assert.Equal(user.Email,     item.Email);
        Assert.Equal(wallet.Id,      item.WalletId);
        Assert.Equal(7,              item.TransactionCount);
        Assert.Equal(3500m,          item.TotalAmount);
        Assert.Contains("frequency", item.Reason);
    }

    [Fact]
    public async Task Handle_WalletNotFound_SkipsFlag()
    {
        var flags = new List<SuspiciousActivityFlag>
        {
            new(Guid.NewGuid(), "some reason", 3, 1000m, DateTime.UtcNow)
        };

        _transactionRepo.Setup(r => r.GetSuspiciousActivityAsync(default))
            .ReturnsAsync(flags);

        _walletRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((Wallet?)null);

        var result = await CreateHandler()
            .Handle(new GetSuspiciousActivityQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Handle_MultipleFlags_ReturnsAll()
    {
        var user1   = User.Create("user1@test.com", "hash", "User One");
        var user2   = User.Create("user2@test.com", "hash", "User Two");
        var wallet1 = CreateWallet(user1.Id);
        var wallet2 = CreateWallet(user2.Id);

        var flags = new List<SuspiciousActivityFlag>
        {
            new(wallet1.Id, "High frequency", 6, 2000m, DateTime.UtcNow),
            new(wallet2.Id, "Large transaction", 1, 6000m, DateTime.UtcNow)
        };

        _transactionRepo.Setup(r => r.GetSuspiciousActivityAsync(default))
            .ReturnsAsync(flags);

        _walletRepo.Setup(r => r.GetByIdAsync(wallet1.Id, default)).ReturnsAsync(wallet1);
        _walletRepo.Setup(r => r.GetByIdAsync(wallet2.Id, default)).ReturnsAsync(wallet2);
        _userRepo.Setup(r => r.GetByIdAsync(user1.Id, default)).ReturnsAsync(user1);
        _userRepo.Setup(r => r.GetByIdAsync(user2.Id, default)).ReturnsAsync(user2);

        var result = await CreateHandler()
            .Handle(new GetSuspiciousActivityQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
    }
}