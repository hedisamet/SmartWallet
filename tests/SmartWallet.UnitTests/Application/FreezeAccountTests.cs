using Moq;
using SmartWallet.Application.Admin.Commands;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Application;

public class FreezeAccountTests
{
    private readonly Mock<IWalletRepository> _walletRepo = new();
    private readonly Mock<IUserRepository>   _userRepo   = new();
    private readonly Mock<IUnitOfWork>       _unitOfWork = new();

    private FreezeAccountCommandHandler CreateHandler() => new(
        _walletRepo.Object,
        _userRepo.Object,
        _unitOfWork.Object);

    private static User CreateUser()
        => User.Create("test@test.com", "hashedpassword", "Test User");

    private static Wallet CreateWallet(Guid userId, decimal balance = 0)
    {
        var wallet = Wallet.Create(userId, Currency.TND);
        if (balance > 0)
            wallet.Deposit(Money.Of(balance, Currency.TND));
        wallet.ClearDomainEvents();
        return wallet;
    }

    [Fact]
    public async Task Handle_ValidUser_FreezesWallet()
    {
        var user   = CreateUser();
        var wallet = CreateWallet(user.Id, 500m);

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);
        _walletRepo.Setup(r => r.GetByUserIdAsync(user.Id, default))
            .ReturnsAsync(wallet);

        var result = await CreateHandler().Handle(
            new FreezeAccountCommand(user.Id, "fraud detected"), default);

        Assert.True(result.IsSuccess);
        Assert.True(wallet.IsLocked);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((User?)null);

        var result = await CreateHandler().Handle(
            new FreezeAccountCommand(Guid.NewGuid(), "reason"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal("User not found.", result.Error);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Never);
    }

    [Fact]
    public async Task Handle_WalletNotFound_ReturnsFailure()
    {
        var user = CreateUser();

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);
        _walletRepo.Setup(r => r.GetByUserIdAsync(user.Id, default))
            .ReturnsAsync((Wallet?)null);

        var result = await CreateHandler().Handle(
            new FreezeAccountCommand(user.Id, "reason"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal("Wallet not found.", result.Error);
    }

    [Fact]
    public async Task Handle_AlreadyFrozen_ReturnsFailure()
    {
        var user   = CreateUser();
        var wallet = CreateWallet(user.Id);
        wallet.Lock("already locked");
        wallet.ClearDomainEvents();

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);
        _walletRepo.Setup(r => r.GetByUserIdAsync(user.Id, default))
            .ReturnsAsync(wallet);

        var result = await CreateHandler().Handle(
            new FreezeAccountCommand(user.Id, "reason"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal("Account is already frozen.", result.Error);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Never);
    }
}