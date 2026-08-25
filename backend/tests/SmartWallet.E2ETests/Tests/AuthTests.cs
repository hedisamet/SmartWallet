using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Infrastructure;
using SmartWallet.E2ETests.Pages.Auth;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for registration and login flows.
/// Uses a plain BrowserFixture (no pre-auth) since these tests verify auth itself.
/// </summary>
[Collection("Browser")]
public class AuthTests : BaseTest, IClassFixture<BrowserFixture>
{
    public AuthTests(BrowserFixture fixture, ITestOutputHelper output)
        : base(fixture, output) { }

    // ── Registration ──────────────────────────────────────────────────────

    [Fact]
    public void Register_WithValidData_LandsOnDashboard()
    {
        RunTest(nameof(Register_WithValidData_LandsOnDashboard), () =>
        {
            var email    = TestDataBuilder.UniqueEmail("reg");
            var fullName = TestDataBuilder.FullName("Reg");

            Fixture.NavigateTo("/auth/register");
            var dashboard = new RegisterPage(Driver, Wait)
                .Register(fullName, email, TestDataBuilder.Password);

            dashboard.WaitForLoad();
            Assert.True(dashboard.IsAt, "Should land on /dashboard after registration");
        });
    }

    [Fact]
    public void Register_WithDuplicateEmail_ShowsError()
    {
        RunTest(nameof(Register_WithDuplicateEmail_ShowsError), () =>
        {
            var email    = TestDataBuilder.UniqueEmail("dup");
            var fullName = TestDataBuilder.FullName("Dup");

            // First registration
            Fixture.NavigateTo("/auth/register");
            new RegisterPage(Driver, Wait)
                .Register(fullName, email, TestDataBuilder.Password)
                .WaitForLoad();

            // Second registration with same email
            Fixture.NavigateTo("/auth/register");
            var registerPage = new RegisterPage(Driver, Wait)
                .EnterFullName(fullName)
                .EnterEmail(email)
                .EnterPassword(TestDataBuilder.Password)
                .ClickRegisterExpectingError();

            // Server rejects duplicate email → global interceptor shows toast error
            Assert.True(registerPage.HasAnyError, "Duplicate email should show an error");
        });
    }

    [Fact]
    public void Register_WithShortPassword_ShowsValidationError()
    {
        RunTest(nameof(Register_WithShortPassword_ShowsValidationError), () =>
        {
            Fixture.NavigateTo("/auth/register");
            var registerPage = new RegisterPage(Driver, Wait)
                .EnterFullName(TestDataBuilder.FullName("Short"))
                .EnterEmail(TestDataBuilder.UniqueEmail("short"))
                .EnterPassword("123")
                .ClickRegisterExpectingError();

            Assert.True(registerPage.HasFormError, "Short password should fail validation");
        });
    }

    // ── Login ─────────────────────────────────────────────────────────────

    [Fact]
    public void Login_WithValidCredentials_LandsOnDashboard()
    {
        RunTest(nameof(Login_WithValidCredentials_LandsOnDashboard), () =>
        {
            var email    = TestDataBuilder.UniqueEmail("login");
            var fullName = TestDataBuilder.FullName("Login");

            // Register first
            Fixture.NavigateTo("/auth/register");
            new RegisterPage(Driver, Wait)
                .Register(fullName, email, TestDataBuilder.Password)
                .WaitForLoad();

            // Navigate to login and sign in
            Fixture.NavigateTo("/auth/login");
            var dashboard = new LoginPage(Driver, Wait)
                .Login(email, TestDataBuilder.Password);

            dashboard.WaitForLoad();
            Assert.True(dashboard.IsAt, "Should land on /dashboard after login");
        });
    }

    [Fact]
    public void Login_WithWrongPassword_ShowsError()
    {
        RunTest(nameof(Login_WithWrongPassword_ShowsError), () =>
        {
            var email    = TestDataBuilder.UniqueEmail("badpwd");
            var fullName = TestDataBuilder.FullName("BadPwd");

            // Register first
            Fixture.NavigateTo("/auth/register");
            new RegisterPage(Driver, Wait)
                .Register(fullName, email, TestDataBuilder.Password)
                .WaitForLoad();

            // Try login with wrong password
            Fixture.NavigateTo("/auth/login");
            var loginPage = new LoginPage(Driver, Wait)
                .EnterEmail(email)
                .EnterPassword("WrongPass@999")
                .ClickSignInExpectingError();

            // Server rejects wrong password → global interceptor shows toast error
            Assert.True(loginPage.HasAnyError, "Wrong password should show error");
        });
    }

    [Fact]
    public void Login_WithNonExistentEmail_ShowsError()
    {
        RunTest(nameof(Login_WithNonExistentEmail_ShowsError), () =>
        {
            Fixture.NavigateTo("/auth/login");
            var loginPage = new LoginPage(Driver, Wait)
                .EnterEmail("nobody@notexist.com")
                .EnterPassword(TestDataBuilder.Password)
                .ClickSignInExpectingError();

            // Server returns 401/400 → global interceptor shows toast error
            Assert.True(loginPage.HasAnyError, "Non-existent email should show error");
        });
    }

    [Fact]
    public void UnauthenticatedUser_AccessingDashboard_RedirectedToLogin()
    {
        RunTest(nameof(UnauthenticatedUser_AccessingDashboard_RedirectedToLogin), () =>
        {
            // Clear any existing session by navigating without auth state
            Driver.Manage().Cookies.DeleteAllCookies();
            Fixture.NavigateTo("/dashboard");

            Wait.WaitForUrl("/auth/login");
            Assert.Contains("/auth/login", Driver.Url);
        });
    }
}
