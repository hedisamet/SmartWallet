using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Transfer;

namespace SmartWallet.E2ETests.Pages.Wallet;

public class WalletPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By Balance     = By.CssSelector(".wallet-card__balance");
    private static readonly By WalletId   = By.Id("user-wallet-id");
    private static readonly By DepositBtn = By.Id("wallet-deposit-btn");
    private static readonly By SendBtn    = By.Id("wallet-send-btn");
    private static readonly By HistoryBtn = By.Id("wallet-history-btn");
    private static readonly By StatusBadge = By.CssSelector(".badge");

    public WalletPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public WalletPage WaitForLoad()
    {
        Find(WalletId);
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

    // ── Assertions ─────────────────────────────────────────────────────

    public string BalanceText   => GetText(Balance);
    public string WalletIdText  => GetText(WalletId);
    public string StatusText    => Exists(StatusBadge) ? GetText(StatusBadge) : string.Empty;
    public bool   IsActive      => StatusText.Contains("Active", StringComparison.OrdinalIgnoreCase);
}
