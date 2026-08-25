using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Shared;
using SmartWallet.E2ETests.Pages.Transfer;
using SmartWallet.E2ETests.Pages.Wallet;

namespace SmartWallet.E2ETests.Pages.Dashboard;

public class DashboardPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By BalanceAmount     = By.CssSelector(".balance-hero__amount");
    private static readonly By DepositBtn        = By.Id("dashboard-deposit-btn");
    private static readonly By SendBtn           = By.Id("dashboard-send-btn");
    private static readonly By ViewAllTxBtn      = By.Id("view-all-transactions");
    private static readonly By RefreshBtn        = By.Id("dashboard-refresh-btn");
    private static readonly By StatCards         = By.CssSelector(".stat-card");
    private static readonly By RecentTxRows      = By.CssSelector(".tx-row");
    private static readonly By WelcomeHeading    = By.CssSelector("h1, h2");

    public DashboardPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    public TopbarComponent Topbar => new(Driver, Wait);

    // ── Actions ────────────────────────────────────────────────────────

    public DashboardPage WaitForLoad()
    {
        Find(BalanceAmount);
        return this;
    }

    public DepositPage GoToDeposit()
    {
        Click(DepositBtn);
        WaitForNavigation("/wallet/deposit");
        return new DepositPage(Driver, Wait);
    }

    public SendMoneyPage GoToSendMoney()
    {
        Click(SendBtn);
        WaitForNavigation("/transfer");
        return new SendMoneyPage(Driver, Wait);
    }

    public void Refresh() => Click(RefreshBtn);

    // ── Assertions ─────────────────────────────────────────────────────

    public string BalanceText      => GetText(BalanceAmount);
    public int    StatCardCount    => FindAll(StatCards).Count;
    public int    RecentTxCount    => FindAll(RecentTxRows).Count;
    public new bool IsAt            => base.IsAt("/dashboard");
}
