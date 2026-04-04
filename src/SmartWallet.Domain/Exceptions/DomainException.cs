namespace SmartWallet.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

public class InsufficientFundsException : DomainException
{
    public InsufficientFundsException(Guid walletId, decimal balance, decimal requested)
        : base($"Wallet {walletId} has insufficient funds. Balance: {balance}, Requested: {requested}") { }
}

public class WalletLockedException : DomainException
{
    public WalletLockedException(Guid walletId)
        : base($"Wallet {walletId} is locked.") { }
}

public class CurrencyMismatchException : DomainException
{
    public CurrencyMismatchException(string walletCurrency, string amountCurrency)
        : base($"Currency mismatch. Wallet: {walletCurrency}, Amount: {amountCurrency}") { }
}