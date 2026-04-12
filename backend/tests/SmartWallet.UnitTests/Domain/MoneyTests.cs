using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.UnitTests.Domain;

public class MoneyTests
{
    [Fact]
    public void Create_ValidAmount_SetsValue()
    {
        var money = Money.Of(100.50m, Currency.TND);

        Assert.Equal(100.50m, money.Value);
        Assert.Equal(Currency.TND, money.Currency);
    }

    [Fact]
    public void Create_ZeroAmount_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Money.Of(0m, Currency.TND));
    }

    [Fact]
    public void Create_NegativeAmount_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Money.Of(-50m, Currency.TND));
    }

    [Fact]
    public void Create_RoundsToTwoDecimalPlaces()
    {
        var money = Money.Of(100.999m, Currency.TND);

        Assert.Equal(101.00m, money.Value);
    }

    [Fact]
    public void TwoMoneyObjects_SameValueAndCurrency_AreEqual()
    {
        var a = Money.Of(100m, Currency.TND);
        var b = Money.Of(100m, Currency.TND);

        Assert.Equal(a, b);
    }

    [Fact]
    public void TwoMoneyObjects_DifferentCurrency_AreNotEqual()
    {
        var a = Money.Of(100m, Currency.TND);
        var b = Money.Of(100m, Currency.USD);

        Assert.NotEqual(a, b);
    }
}