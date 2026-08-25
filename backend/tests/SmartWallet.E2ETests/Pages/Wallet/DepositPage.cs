using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Wallet;

public class DepositPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By AmountInput       = By.Id("amount");
    private static readonly By SubmitBtn         = By.Id("deposit-submit");
    private static readonly By FormError         = By.CssSelector(".form-error");
    private static readonly By ServerError       = By.CssSelector(".toast--error");
    private static readonly By QuickAmountBtns   = By.CssSelector(".quick-amount-btn");
    private static readonly By CurrencyBtns      = By.CssSelector(".currency-btn");
    private static readonly By CurrencySymbol    = By.CssSelector(".currency-symbol");

    public DepositPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public DepositPage EnterAmount(string amount)
    {
        Type(AmountInput, amount);
        return this;
    }

    public DepositPage ClickQuickAmount(string amount)
    {
        var btn = FindAll(QuickAmountBtns)
            .FirstOrDefault(b => b.Text.Contains(amount));
        btn?.Click();
        return this;
    }

    public DepositPage SelectCurrency(string currency)
    {
        var btn = FindAll(CurrencyBtns)
            .FirstOrDefault(b => b.Text.Trim().Equals(currency, StringComparison.OrdinalIgnoreCase));
        btn?.Click();
        return this;
    }

    /// <summary>Submits the deposit. On success the app navigates to /wallet.</summary>
    public WalletPage Submit()
    {
        Click(SubmitBtn);
        WaitForNavigation("/wallet");
        return new WalletPage(Driver, Wait);
    }

    public DepositPage SubmitExpectingError()
    {
        Click(SubmitBtn);
        WaitForAnyError(FormError, ServerError);
        return this;
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public bool   HasFormError     => IsDisplayed(FormError);
    public bool   HasServerError   => IsDisplayed(ServerError);
    public bool   HasAnyError      => HasFormError || HasServerError;
    public string FormErrorText    => Exists(FormError) ? GetText(FormError) : string.Empty;
    public string SelectedCurrency => Exists(CurrencySymbol) ? GetText(CurrencySymbol) : string.Empty;
    public string AmountValue      => GetValue(AmountInput);
}
