using SmartWallet.Domain.Common;
using SmartWallet.Domain.Exceptions;

namespace SmartWallet.Domain.Entities;

public class User : AggregateRoot
{
    public Guid     Id           { get; private set; }
    public string   Email        { get; private set; } = null!;
    public string   PasswordHash { get; private set; } = null!;
    public string   FullName     { get; private set; } = null!;
    public string Role { get; internal set; } = null!;
    public bool     IsActive     { get; private set; }
    public DateTime CreatedAt    { get; private set; }

    private User() { }

    public static User Create(string email, string passwordHash, string fullName)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email cannot be empty.");

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash cannot be empty.");

        return new User
        {
            Id           = Guid.NewGuid(),
            Email        = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FullName     = fullName.Trim(),
            Role         = "User",
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow,
        };
    }
    public static User CreateAdmin(string email, string passwordHash, string fullName)
    {
        var user = Create(email, passwordHash, fullName);
        user.Role = "Admin";
        return user;
    }
}