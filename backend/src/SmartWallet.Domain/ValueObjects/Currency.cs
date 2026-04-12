using SmartWallet.Domain.Exceptions;

namespace SmartWallet.Domain.ValueObjects;

public record Currency
{
    public static readonly Currency TND = new("TND");
    public static readonly Currency USD = new("USD");
    public static readonly Currency EUR = new("EUR");

    public string Code { get; }

    private Currency(string code) => Code = code;

    public static Currency From(string code)
    {
        var known = new[] { TND, USD, EUR };
        var match = known.FirstOrDefault(c =>
            c.Code.Equals(code, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            throw new DomainException($"Unsupported currency: '{code}'");

        return match;
    }

    public override string ToString() => Code;
}