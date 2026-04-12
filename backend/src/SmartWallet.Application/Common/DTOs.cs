namespace SmartWallet.Application.Common;

public record TransactionHistoryItem(
    Guid      Id,
    Guid      IdempotencyKey,
    decimal   Amount,
    string    Currency,
    string    Type,
    string    Status,
    Guid      SenderWalletId,
    string?   SenderName,
    Guid      ReceiverWalletId,
    string?   ReceiverName,
    string?   Description,
    DateTime  CreatedAt,
    DateTime? CompletedAt
);

public record AdminTransactionItem(
    Guid      Id,
    Guid      IdempotencyKey,
    decimal   Amount,
    string    Currency,
    string    Type,
    string    Status,
    Guid      SenderWalletId,
    string?   SenderName,
    Guid      ReceiverWalletId,
    string?   ReceiverName,
    string?   Description,
    string?   FailureReason,
    DateTime  CreatedAt,
    DateTime? CompletedAt
);
