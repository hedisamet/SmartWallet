using Moq;
using SmartWallet.Application.Admin.Commands;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Application;

public class UnfreezeAccountTests
{
    private readonly Mock<IWalletRepository> _walletRepo = new();
    private readonly Mock<IUserRepository>   _userRepo   = new();
    private readonly Mock<IUnitOfWork>       _unitOfWork = new();

    private UnfreezeAccountCommandHandler CreateHandler() => new(
        _walletRepo.Object,
        _userRepo.Object,
        _unitOfWork.Object);

    private static User CreateUser()
        => User.Create("test@test.com", "hashedpassword", "Test User");

    private static Wallet CreateLockedWallet(Guid userId)
    {
        var wallet = Wallet.Create(userId, Currency.TND);
        wallet.Lock("test lock");
        wallet.ClearDomainEvents();
        return wallet;
    }

    [Fact]
    public async Task Handle_LockedWallet_UnfreezesIt()
    {
        var user   = CreateUser();
        var wallet = CreateLockedWallet(user.Id);

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);
        _walletRepo.Setup(r => r.GetByUserIdAsync(user.Id, default))
            .ReturnsAsync(wallet);

        var result = await CreateHandler().Handle(
            new UnfreezeAccountCommand(user.Id), default);

        Assert.True(result.IsSuccess);
        Assert.False(wallet.IsLocked);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((User?)null);

        var result = await CreateHandler().Handle(
            new UnfreezeAccountCommand(Guid.NewGuid()), default);

        Assert.False(result.IsSuccess);
        Assert.Equal("User not found.", result.Error);
    }

    [Fact]
    public async Task Handle_UnfreezeAlreadyUnlocked_IsIdempotent()
    {
        var user   = CreateUser();
        var wallet = Wallet.Create(user.Id, Currency.TND);
        wallet.ClearDomainEvents();

        _userRepo.Setup(r => r.GetByIdAsync(user.Id, default))
            .ReturnsAsync(user);
        _walletRepo.Setup(r => r.GetByUserIdAsync(user.Id, default))
            .ReturnsAsync(wallet);

        var result = await CreateHandler().Handle(
            new UnfreezeAccountCommand(user.Id), default);

        // Should succeed silently — Wallet.Unlock() is idempotent
        Assert.True(result.IsSuccess);
        Assert.False(wallet.IsLocked);
    }
}