using SmartWallet.Domain.Entities;

namespace SmartWallet.UnitTests.Domain;

public class TransactionTests
{
    private static Transaction CreateTransaction() => Transaction.Create(
        idempotencyKey   : Guid.NewGuid(),
        senderWalletId   : Guid.NewGuid(),
        receiverWalletId : Guid.NewGuid(),
        amount           : 100m,
        currency         : "TND",
        type             : TransactionType.Transfer,
        description      : "test"
    );

    [Fact]
    public void Create_AlwaysStartsAsPending()
    {
        var tx = CreateTransaction();

        Assert.Equal(TransactionStatus.Pending, tx.Status);
        Assert.Null(tx.CompletedAt);
    }

    [Fact]
    public void MarkSuccess_SetsStatusAndCompletedAt()
    {
        var tx = CreateTransaction();

        tx.MarkSuccess();

        Assert.Equal(TransactionStatus.Success, tx.Status);
        Assert.NotNull(tx.CompletedAt);
    }

    [Fact]
    public void MarkFailed_SetsStatusAndReason()
    {
        var tx = CreateTransaction();

        tx.MarkFailed("Insufficient funds");

        Assert.Equal(TransactionStatus.Failed, tx.Status);
        Assert.Equal("Insufficient funds", tx.FailureReason);
        Assert.NotNull(tx.CompletedAt);
    }
}