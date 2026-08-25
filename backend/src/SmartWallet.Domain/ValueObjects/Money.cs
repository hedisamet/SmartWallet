using SmartWallet.Domain.Exceptions;

namespace SmartWallet.Domain.ValueObjects;

public record Money
{
    public decimal  Value    { get; }
    public Currency Currency { get; }

    public Money(decimal value, Currency currency)
    {
        if (value <= 0)
            throw new DomainException($"Money value must be positive. Got: {value}");

        Value    = Math.Round(value, 2, MidpointRounding.AwayFromZero);
        Currency = currency;
    }

    public static Money Of(decimal value, Currency currency) => new(value, currency);

    public override string ToString() =>
        $"{Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)} {Currency.Code}";
}