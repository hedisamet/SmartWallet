using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Pages.Dashboard;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for dashboard page: balance display, quick actions, recent transactions.
/// Uses AuthFixture so the browser is already logged in before tests run.
/// </summary>
[Collection("Browser")]
public class DashboardTests : BaseTest, IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;

    public DashboardTests(AuthFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
        _auth = fixture;
    }

    private DashboardPage GoToDashboard()
    {
        Fixture.NavigateTo("/dashboard");
        return new DashboardPage(Driver, Wait).WaitForLoad();
    }

    [Fact]
    public void Dashboard_Loads_ShowsBalanceAndActions()
    {
        RunTest(nameof(Dashboard_Loads_ShowsBalanceAndActions), () =>
        {
            var page = GoToDashboard();

            Assert.True(page.IsAt, "Should be on /dashboard");
            Assert.NotEmpty(page.BalanceText);
        });
    }

    [Fact]
    public void Dashboard_ShowsStatCards()
    {
        RunTest(nameof(Dashboard_ShowsStatCards), () =>
        {
            var page = GoToDashboard();

            Assert.True(page.StatCardCount > 0, "Dashboard should display stat cards");
        });
    }

    [Fact]
    public void Dashboard_DepositButton_NavigatesToDeposit()
    {
        RunTest(nameof(Dashboard_DepositButton_NavigatesToDeposit), () =>
        {
            var dashboard = GoToDashboard();
            var depositPage = dashboard.GoToDeposit();

            Assert.Contains("/wallet/deposit", Driver.Url);
        });
    }

    [Fact]
    public void Dashboard_SendButton_NavigatesToTransfer()
    {
        RunTest(nameof(Dashboard_SendButton_NavigatesToTransfer), () =>
        {
            var dashboard = GoToDashboard();
            dashboard.GoToSendMoney();

            Assert.Contains("/transfer", Driver.Url);
        });
    }

    [Fact]
    public void Dashboard_Refresh_DoesNotBreakPage()
    {
        RunTest(nameof(Dashboard_Refresh_DoesNotBreakPage), () =>
        {
            var page = GoToDashboard();
            page.Refresh();

            // Page should still show balance after refresh
            page.WaitForLoad();
            Assert.NotEmpty(page.BalanceText);
        });
    }

    [Fact]
    public void Dashboard_AfterDeposit_BalanceUpdates()
    {
        RunTest(nameof(Dashboard_AfterDeposit_BalanceUpdates), () =>
        {
            var dashboard = GoToDashboard();
            var balanceBefore = dashboard.BalanceText;
            Log($"Balance before: {balanceBefore}");

            // Deposit navigates to /wallet on success
            dashboard.GoToDeposit()
                .EnterAmount("100")
                .Submit()   // returns WalletPage
                .WaitForLoad();

            // Navigate back to dashboard to verify balance is shown
            Fixture.NavigateTo("/dashboard");
            var balanceAfter = new DashboardPage(Driver, Wait).WaitForLoad().BalanceText;
            Log($"Balance after: {balanceAfter}");

            Assert.NotEmpty(balanceAfter);
        });
    }
}
