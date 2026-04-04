using SmartWallet.Domain.Common;
using SmartWallet.Domain.Events;
using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.Domain.Entities;

public class Wallet : AggregateRoot
{
    private decimal _balance;
    private bool    _isLocked;

    public Guid     Id        { get; private set; }
    public Guid     UserId    { get; private set; }
    public Currency Currency  { get; private set; } = null!;
    public decimal  Balance   => _balance;
    public bool     IsLocked  => _isLocked;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Wallet() { }

    public static Wallet Create(Guid userId, Currency currency)
    {
        if (userId == Guid.Empty)
            throw new DomainException("UserId cannot be empty.");

        var wallet = new Wallet
        {
            Id        = Guid.NewGuid(),
            UserId    = userId,
            Currency  = currency,
            _balance  = 0m,
            _isLocked = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        wallet.AddDomainEvent(new WalletCreatedEvent(wallet.Id, userId));
        return wallet;
    }

    public void Credit(Money amount)
    {
        GuardLocked();
        GuardCurrencyMatch(amount);

        _balance  += amount.Value;
        UpdatedAt  = DateTime.UtcNow;

        AddDomainEvent(new WalletCreditedEvent(Id, amount.Value, _balance));
    }

    public void Debit(Money amount)
    {
        GuardLocked();
        GuardCurrencyMatch(amount);
        GuardSufficientFunds(amount);

        _balance  -= amount.Value;
        UpdatedAt  = DateTime.UtcNow;

        AddDomainEvent(new WalletDebitedEvent(Id, amount.Value, _balance));
    }

    public void Deposit(Money amount)
    {
        GuardLocked();
        GuardCurrencyMatch(amount);

        _balance  += amount.Value;
        UpdatedAt  = DateTime.UtcNow;

        AddDomainEvent(new DepositReceivedEvent(Id, amount.Value, _balance));
    }

    public void Lock(string reason)
    {
        if (_isLocked) return;
        _isLocked = true;
        UpdatedAt = DateTime.UtcNow;
        AddDomainEvent(new WalletLockedEvent(Id, UserId, reason));
    }

    public void Unlock()
    {
        if (!_isLocked) return;
        _isLocked = false;
        UpdatedAt = DateTime.UtcNow;
        AddDomainEvent(new WalletUnlockedEvent(Id, UserId));
    }

    private void GuardLocked()
    {
        if (_isLocked)
            throw new WalletLockedException(Id);
    }

    private void GuardCurrencyMatch(Money amount)
    {
        if (amount.Currency != Currency)
            throw new CurrencyMismatchException(Currency.Code, amount.Currency.Code);
    }

    private void GuardSufficientFunds(Money amount)
    {
        if (_balance < amount.Value)
            throw new InsufficientFundsException(Id, _balance, amount.Value);
    }
}