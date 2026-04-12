namespace SmartWallet.Application.Interfaces;

public interface ICurrentUserService
{
    Guid   UserId { get; }
    string Email  { get; }
    bool   IsAdmin { get; }
}