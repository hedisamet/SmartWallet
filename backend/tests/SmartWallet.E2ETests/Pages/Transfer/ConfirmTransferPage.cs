using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Transactions;

namespace SmartWallet.E2ETests.Pages.Transfer;

public class ConfirmTransferPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By ConfirmBtn       = By.Id("confirm-transfer-btn");
    private static readonly By CancelBtn        = By.Id("cancel-transfer");
    private static readonly By AmountDisplay    = By.CssSelector(".confirm-amount");
    private static readonly By DetailValuesBy   = By.CssSelector(".detail-value");
    private static readonly By SuccessCard      = By.CssSelector(".success-card");
    private static readonly By ViewTxBtn        = By.Id("view-transaction");
    private static readonly By BackDashboardBtn = By.Id("back-to-dashboard");

    public ConfirmTransferPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public ConfirmTransferPage WaitForLoad()
    {
        Find(ConfirmBtn);
        return this;
    }

    public ConfirmTransferPage Confirm()
    {
        Click(ConfirmBtn);
        Find(SuccessCard); // wait for success state
        return this;
    }

    public void Cancel()
    {
        Click(CancelBtn);
        WaitForNavigation("/transfer");
    }

    public TransactionListPage ViewTransactions()
    {
        Click(ViewTxBtn);
        WaitForNavigation("/transactions");
        return new TransactionListPage(Driver, Wait);
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public bool   IsSuccess       => IsDisplayed(SuccessCard);
    public string AmountText      => Exists(AmountDisplay) ? GetText(AmountDisplay) : string.Empty;

    public IReadOnlyList<string> DetailValues
        => FindAll(DetailValuesBy).Select(e => e.Text).ToList();
}
