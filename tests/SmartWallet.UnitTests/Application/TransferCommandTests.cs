using Moq;
using SmartWallet.Application.Interfaces;
using SmartWallet.Application.Transfers.Commands;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Application;

public class TransferCommandTests
{
    private readonly Mock<IWalletRepository>      _walletRepo      = new();
    private readonly Mock<ITransactionRepository> _transactionRepo = new();
    private readonly Mock<IUnitOfWork>            _unitOfWork      = new();

    private TransferCommandHandler CreateHandler() => new(
        _walletRepo.Object,
        _transactionRepo.Object,
        _unitOfWork.Object);

    private static Wallet CreateWallet(Guid userId, decimal balance = 0)
    {
        var wallet = Wallet.Create(userId, Currency.TND);
        if (balance > 0)
        {
            wallet.Deposit(Money.Of(balance, Currency.TND));
            wallet.ClearDomainEvents();
        }
        return wallet;
    }

    [Fact]
    public async Task Handle_ValidTransfer_DebitsAndCreditsCorrectly()
    {
        var sender   = CreateWallet(Guid.NewGuid(), 500m);
        var receiver = CreateWallet(Guid.NewGuid());

        var command = new TransferCommand(
            sender.UserId, receiver.Id, 200m, "TND",
            Guid.NewGuid(), "test");

        SetupMocks(sender, receiver, command.IdempotencyKey);

        var result = await CreateHandler().Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.Equal(300m, sender.Balance);
        Assert.Equal(200m, receiver.Balance);
        Assert.Equal("Success", result.Value!.Status);
    }

    [Fact]
    public async Task Handle_InsufficientFunds_ReturnsFailure()
    {
        var sender   = CreateWallet(Guid.NewGuid(), 50m);
        var receiver = CreateWallet(Guid.NewGuid());

        var command = new TransferCommand(
            sender.UserId, receiver.Id, 200m, "TND",
            Guid.NewGuid(), null);

        SetupMocks(sender, receiver, command.IdempotencyKey);

        var result = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Contains("insufficient funds", result.Error,
            StringComparison.OrdinalIgnoreCase);

        // Balance must not have changed
        Assert.Equal(50m, sender.Balance);
        Assert.Equal(0m,  receiver.Balance);
    }

    [Fact]
    public async Task Handle_SelfTransfer_ReturnsFailure()
    {
        var sender = CreateWallet(Guid.NewGuid(), 500m);

        var command = new TransferCommand(
            sender.UserId, sender.Id, 100m, "TND",
            Guid.NewGuid(), null);

        _transactionRepo.Setup(r =>
            r.FindByIdempotencyKeyAsync(command.IdempotencyKey, default))
            .ReturnsAsync((Transaction?)null);

        _unitOfWork.Setup(u => u.BeginTransactionAsync(default))
            .Returns(Task.CompletedTask);
        _unitOfWork.Setup(u => u.RollbackAsync(default))
            .Returns(Task.CompletedTask);

        _walletRepo.Setup(r => r.GetByUserIdWithLockAsync(sender.UserId, default))
            .ReturnsAsync(sender);
        _walletRepo.Setup(r => r.GetByIdWithLockAsync(sender.Id, default))
            .ReturnsAsync(sender);

        var result = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Contains("same wallet", result.Error,
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Handle_DuplicateIdempotencyKey_ReturnsCachedResult()
    {
        var existingTx = Transaction.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            100m, "TND", TransactionType.Transfer);
        existingTx.MarkSuccess();

        var command = new TransferCommand(
            Guid.NewGuid(), Guid.NewGuid(), 100m, "TND",
            existingTx.IdempotencyKey, null);

        _transactionRepo.Setup(r =>
            r.FindByIdempotencyKeyAsync(existingTx.IdempotencyKey, default))
            .ReturnsAsync(existingTx);

        var result = await CreateHandler().Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.Equal(existingTx.Id, result.Value!.TransactionId);

        // Nothing else should have been touched
        _walletRepo.Verify(r =>
            r.GetByUserIdWithLockAsync(It.IsAny<Guid>(), default), Times.Never);
        _unitOfWork.Verify(u =>
            u.BeginTransactionAsync(default), Times.Never);
    }

    [Fact]
    public async Task Handle_LockedSenderWallet_ReturnsFailure()
    {
        var sender   = CreateWallet(Guid.NewGuid(), 500m);
        var receiver = CreateWallet(Guid.NewGuid());
        sender.Lock("fraud");
        sender.ClearDomainEvents();

        var command = new TransferCommand(
            sender.UserId, receiver.Id, 100m, "TND",
            Guid.NewGuid(), null);

        SetupMocks(sender, receiver, command.IdempotencyKey);

        var result = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Contains("locked", result.Error,
            StringComparison.OrdinalIgnoreCase);
        Assert.Equal(500m, sender.Balance);
    }

    [Fact]
    public async Task Handle_SenderNotFound_ReturnsFailure()
    {
        var command = new TransferCommand(
            Guid.NewGuid(), Guid.NewGuid(), 100m, "TND",
            Guid.NewGuid(), null);

        _transactionRepo.Setup(r =>
            r.FindByIdempotencyKeyAsync(command.IdempotencyKey, default))
            .ReturnsAsync((Transaction?)null);

        _unitOfWork.Setup(u => u.BeginTransactionAsync(default))
            .Returns(Task.CompletedTask);
        _unitOfWork.Setup(u => u.RollbackAsync(default))
            .Returns(Task.CompletedTask);

        _walletRepo.Setup(r =>
            r.GetByUserIdWithLockAsync(command.SenderId, default))
            .ReturnsAsync((Wallet?)null);

        var result = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal("Sender wallet not found.", result.Error);
    }

    private void SetupMocks(Wallet sender, Wallet receiver, Guid idempotencyKey)
    {
        _transactionRepo.Setup(r =>
            r.FindByIdempotencyKeyAsync(idempotencyKey, default))
            .ReturnsAsync((Transaction?)null);

        _transactionRepo.Setup(r =>
            r.AddAsync(It.IsAny<Transaction>(), default))
            .Returns(Task.CompletedTask);

        _unitOfWork.Setup(u => u.BeginTransactionAsync(default))
            .Returns(Task.CompletedTask);
        _unitOfWork.Setup(u => u.CommitAsync(default))
            .Returns(Task.CompletedTask);
        _unitOfWork.Setup(u => u.RollbackAsync(default))
            .Returns(Task.CompletedTask);
        _unitOfWork.Setup(u => u.SaveChangesAsync(default))
            .ReturnsAsync(1);

        _walletRepo.Setup(r =>
            r.GetByUserIdWithLockAsync(sender.UserId, default))
            .ReturnsAsync(sender);
        _walletRepo.Setup(r =>
            r.GetByIdWithLockAsync(receiver.Id, default))
            .ReturnsAsync(receiver);
    }
}