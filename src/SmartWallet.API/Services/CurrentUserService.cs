using System.Security.Claims;
using SmartWallet.Application.Interfaces;

namespace SmartWallet.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    public Guid UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User
                .FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public string Email
        => _httpContextAccessor.HttpContext?.User
            .FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    public bool IsAdmin
        => _httpContextAccessor.HttpContext?.User
            .IsInRole("Admin") ?? false;
}