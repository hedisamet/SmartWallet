using SmartWallet.E2ETests.Infrastructure;
using SmartWallet.E2ETests.Pages.Auth;

namespace SmartWallet.E2ETests.Fixtures;

/// <summary>
/// Extends BrowserFixture by registering a unique test user and logging in
/// before the first test. All tests sharing this fixture start authenticated.
/// </summary>
public class AuthFixture : BrowserFixture
{
    public string UserEmail    { get; private set; } = string.Empty;
    public string UserFullName { get; private set; } = string.Empty;
    public string Password     => TestDataBuilder.Password;

    public new async Task InitializeAsync()
    {
        await base.InitializeAsync();

        UserEmail    = TestDataBuilder.UniqueEmail("main");
        UserFullName = TestDataBuilder.FullName("Main");

        // Register → then login lands on dashboard
        NavigateTo("/auth/register");
        var register = new RegisterPage(Driver, Wait);
        register.Register(UserFullName, UserEmail, Password);

        // Wait until redirected away from /auth
        Wait.WaitForUrl("/dashboard");
    }
}
