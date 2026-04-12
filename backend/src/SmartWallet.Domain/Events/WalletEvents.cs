using SmartWallet.Domain.Common;

namespace SmartWallet.Domain.Events;

public record WalletCreatedEvent(Guid WalletId, Guid UserId) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}

public record WalletCreditedEvent(Guid WalletId, decimal Amount, decimal NewBalance) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}

public record WalletDebitedEvent(Guid WalletId, decimal Amount, decimal NewBalance) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}

public record DepositReceivedEvent(Guid WalletId, decimal Amount, decimal NewBalance) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}

public record WalletLockedEvent(Guid WalletId, Guid UserId, string Reason) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}

public record WalletUnlockedEvent(Guid WalletId, Guid UserId) : IDomainEvent
{
    public DateTime OccurredAt => DateTime.UtcNow;
}