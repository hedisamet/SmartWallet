using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Transactions;

public class TransactionListPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By Rows          = By.CssSelector("tbody tr");
    private static readonly By NextPageBtn   = By.Id("next-page");
    private static readonly By PrevPageBtn   = By.Id("prev-page");
    private static readonly By PaginationInfo = By.CssSelector(".pagination-info");
    private static readonly By FilterChips   = By.CssSelector(".filter-chip");
    private static readonly By RefreshBtn    = By.Id("tx-history-refresh-btn");
    private static readonly By StatusBadges  = By.CssSelector(".badge");

    public TransactionListPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public TransactionListPage WaitForLoad()
    {
        WaitForLoadingGone();
        return this;
    }

    public TransactionListPage FilterByType(string type)
    {
        Click(By.Id($"filter-{type}"));
        return this;
    }

    public TransactionListPage FilterByStatus(string status)
    {
        Click(By.Id($"status-{status}"));
        return this;
    }

    public TransactionDetailPage OpenTransaction(string txIdPrefix)
    {
        Click(By.Id($"view-tx-{txIdPrefix}"));
        WaitForNavigation("/transactions/");
        return new TransactionDetailPage(Driver, Wait);
    }

    public TransactionDetailPage OpenFirstTransaction()
    {
        var firstLink = FindAll(By.CssSelector("[id^='view-tx-']")).First();
        firstLink.Click();
        WaitForNavigation("/transactions/");
        return new TransactionDetailPage(Driver, Wait);
    }

    public void GoToNextPage() => Click(NextPageBtn);
    public void GoToPrevPage() => Click(PrevPageBtn);

    // ── Assertions ─────────────────────────────────────────────────────

    public int    RowCount         => FindAll(Rows).Count;
    public bool   HasRows          => RowCount > 0;
    public string PaginationText   => Exists(PaginationInfo) ? GetText(PaginationInfo) : string.Empty;
    public bool   NextPageEnabled  => Exists(NextPageBtn) && FindClickable(NextPageBtn).Enabled;

    public IReadOnlyList<string> GetStatusTexts()
        => FindAll(StatusBadges).Select(e => e.Text).ToList();
}
