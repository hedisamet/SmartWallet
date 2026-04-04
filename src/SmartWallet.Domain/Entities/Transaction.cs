namespace SmartWallet.Domain.Entities;

public class Transaction
{
    public Guid              Id               { get; private set; }
    public Guid              IdempotencyKey   { get; private set; }
    public Guid              SenderWalletId   { get; private set; }
    public Guid              ReceiverWalletId { get; private set; }
    public decimal           Amount           { get; private set; }
    public string            Currency         { get; private set; } = null!;
    public TransactionType   Type             { get; private set; }
    public TransactionStatus Status           { get; private set; }
    public string?           FailureReason    { get; private set; }
    public string?           Description      { get; private set; }
    public DateTime          CreatedAt        { get; private set; }
    public DateTime?         CompletedAt      { get; private set; }

    private Transaction() { }

    public static Transaction Create(
        Guid    idempotencyKey,
        Guid    senderWalletId,
        Guid    receiverWalletId,
        decimal amount,
        string  currency,
        TransactionType type,
        string? description = null)
    {
        return new Transaction
        {
            Id               = Guid.NewGuid(),
            IdempotencyKey   = idempotencyKey,
            SenderWalletId   = senderWalletId,
            ReceiverWalletId = receiverWalletId,
            Amount           = amount,
            Currency         = currency,
            Type             = type,
            Status           = TransactionStatus.Pending,
            Description      = description,
            CreatedAt        = DateTime.UtcNow,
        };
    }

    public void MarkSuccess()
    {
        Status      = TransactionStatus.Success;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkFailed(string reason)
    {
        Status        = TransactionStatus.Failed;
        FailureReason = reason;
        CompletedAt   = DateTime.UtcNow;
    }
}

public enum TransactionStatus { Pending, Success, Failed }
public enum TransactionType   { Transfer, Deposit, Withdrawal }