using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Transactions;

public class TransactionDetailPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By Amount        = By.CssSelector(".detail-amount");
    private static readonly By TxType        = By.CssSelector(".detail-type");
    private static readonly By StatusBadge   = By.CssSelector(".badge");
    private static readonly By DetailLabels  = By.CssSelector(".detail-label");
    private static readonly By DetailValues  = By.CssSelector(".detail-value");
    private static readonly By BackBtn       = By.Id("back-to-txs");
    private static readonly By NewTransferBtn = By.Id("new-transfer");

    public TransactionDetailPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public TransactionDetailPage WaitForLoad()
    {
        Find(Amount);
        return this;
    }

    public TransactionListPage GoBack()
    {
        Click(BackBtn);
        WaitForNavigation("/transactions");
        return new TransactionListPage(Driver, Wait);
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public string AmountText  => Exists(Amount)    ? GetText(Amount)    : string.Empty;
    public string TypeText    => Exists(TxType)    ? GetText(TxType)    : string.Empty;
    public string StatusText  => Exists(StatusBadge) ? GetText(StatusBadge) : string.Empty;
    public bool   IsSuccess   => StatusText.Contains("Success", StringComparison.OrdinalIgnoreCase);

    public Dictionary<string, string> GetDetails()
    {
        var labels = FindAll(DetailLabels).Select(e => e.Text).ToList();
        var values = FindAll(DetailValues).Select(e => e.Text).ToList();
        return labels.Zip(values).ToDictionary(kv => kv.First, kv => kv.Second);
    }
}
