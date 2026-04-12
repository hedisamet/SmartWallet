using SmartWallet.Domain.Entities;

namespace SmartWallet.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}