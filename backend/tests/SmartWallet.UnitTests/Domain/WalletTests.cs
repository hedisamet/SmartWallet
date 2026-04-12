using SmartWallet.Domain.Entities;
using SmartWallet.Domain.Events;
using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Domain;

public class WalletTests
{
    private static Wallet CreateWallet(decimal initialBalance = 0)
    {
        var wallet = Wallet.Create(Guid.NewGuid(), Currency.TND);
        if (initialBalance > 0)
            wallet.Deposit(Money.Of(initialBalance, Currency.TND));
        wallet.ClearDomainEvents();
        return wallet;
    }

    // ----------------------------------------------------------
    // CREATION
    // ----------------------------------------------------------

    [Fact]
    public void Create_ValidInputs_CreatesWalletWithZeroBalance()
    {
        var wallet = Wallet.Create(Guid.NewGuid(), Currency.TND);

        Assert.Equal(0m, wallet.Balance);
        Assert.False(wallet.IsLocked);
        Assert.Equal("TND", wallet.Currency.Code);
    }

    [Fact]
    public void Create_EmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(
            () => Wallet.Create(Guid.Empty, Currency.TND));
    }

    [Fact]
    public void Create_RaisesWalletCreatedEvent()
    {
        var wallet = Wallet.Create(Guid.NewGuid(), Currency.TND);

        Assert.Single(wallet.DomainEvents);
        Assert.IsType<WalletCreatedEvent>(wallet.DomainEvents.First());
    }

    // ----------------------------------------------------------
    // DEPOSIT
    // ----------------------------------------------------------

    [Fact]
    public void Deposit_ValidAmount_IncreasesBalance()
    {
        var wallet = CreateWallet();

        wallet.Deposit(Money.Of(500m, Currency.TND));

        Assert.Equal(500m, wallet.Balance);
    }

    [Fact]
    public void Deposit_WhenLocked_ThrowsWalletLockedException()
    {
        var wallet = CreateWallet();
        wallet.Lock("test");

        Assert.Throws<WalletLockedException>(
            () => wallet.Deposit(Money.Of(100m, Currency.TND)));
    }

    [Fact]
    public void Deposit_WrongCurrency_ThrowsCurrencyMismatchException()
    {
        var wallet = CreateWallet();

        Assert.Throws<CurrencyMismatchException>(
            () => wallet.Deposit(Money.Of(100m, Currency.USD)));
    }

    // ----------------------------------------------------------
    // DEBIT
    // ----------------------------------------------------------

    [Fact]
    public void Debit_SufficientFunds_DecreasesBalance()
    {
        var wallet = CreateWallet(500m);

        wallet.Debit(Money.Of(200m, Currency.TND));

        Assert.Equal(300m, wallet.Balance);
    }

    [Fact]
    public void Debit_InsufficientFunds_ThrowsInsufficientFundsException()
    {
        var wallet = CreateWallet(100m);

        Assert.Throws<InsufficientFundsException>(
            () => wallet.Debit(Money.Of(200m, Currency.TND)));
    }

    [Fact]
    public void Debit_ExactBalance_ReducesBalanceToZero()
    {
        var wallet = CreateWallet(100m);

        wallet.Debit(Money.Of(100m, Currency.TND));

        Assert.Equal(0m, wallet.Balance);
    }

    [Fact]
    public void Debit_WhenLocked_ThrowsWalletLockedException()
    {
        var wallet = CreateWallet(500m);
        wallet.Lock("fraud");

        Assert.Throws<WalletLockedException>(
            () => wallet.Debit(Money.Of(100m, Currency.TND)));
    }

    [Fact]
    public void Debit_WrongCurrency_ThrowsCurrencyMismatchException()
    {
        var wallet = CreateWallet(500m);

        Assert.Throws<CurrencyMismatchException>(
            () => wallet.Debit(Money.Of(100m, Currency.USD)));
    }

    [Fact]
    public void Debit_RaisesWalletDebitedEvent()
    {
        var wallet = CreateWallet(500m);

        wallet.Debit(Money.Of(100m, Currency.TND));

        Assert.Single(wallet.DomainEvents);
        Assert.IsType<WalletDebitedEvent>(wallet.DomainEvents.First());
    }

    // ----------------------------------------------------------
    // CREDIT
    // ----------------------------------------------------------

    [Fact]
    public void Credit_ValidAmount_IncreasesBalance()
    {
        var wallet = CreateWallet();

        wallet.Credit(Money.Of(300m, Currency.TND));

        Assert.Equal(300m, wallet.Balance);
    }

    [Fact]
    public void Credit_WhenLocked_ThrowsWalletLockedException()
    {
        var wallet = CreateWallet();
        wallet.Lock("fraud");

        Assert.Throws<WalletLockedException>(
            () => wallet.Credit(Money.Of(100m, Currency.TND)));
    }

    // ----------------------------------------------------------
    // LOCK / UNLOCK
    // ----------------------------------------------------------

    [Fact]
    public void Lock_UnlockedWallet_LocksIt()
    {
        var wallet = CreateWallet();

        wallet.Lock("suspicious activity");

        Assert.True(wallet.IsLocked);
    }

    [Fact]
    public void Lock_IsIdempotent()
    {
        var wallet = CreateWallet();
        wallet.Lock("reason A");
        wallet.Lock("reason B");

        Assert.True(wallet.IsLocked);
        Assert.Single(wallet.DomainEvents.OfType<WalletLockedEvent>());
    }

    [Fact]
    public void Unlock_LockedWallet_UnlocksIt()
    {
        var wallet = CreateWallet();
        wallet.Lock("test");
        wallet.ClearDomainEvents();

        wallet.Unlock();

        Assert.False(wallet.IsLocked);
        Assert.Single(wallet.DomainEvents.OfType<WalletUnlockedEvent>());
    }

    [Fact]
    public void Unlock_IsIdempotent()
    {
        var wallet = CreateWallet();

        wallet.Unlock();
        wallet.Unlock();

        Assert.False(wallet.IsLocked);
        Assert.Empty(wallet.DomainEvents.OfType<WalletUnlockedEvent>());
    }
}