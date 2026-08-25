using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Transfer;

public class SendMoneyPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By RecipientInput  = By.Id("receiverWalletId");
    private static readonly By AmountInput     = By.Id("send-amount");
    private static readonly By CurrencySelect  = By.Id("send-currency");
    private static readonly By DescriptionInput = By.Id("description");
    private static readonly By SubmitBtn       = By.Id("send-submit");
    private static readonly By FormError       = By.CssSelector(".form-error");

    public SendMoneyPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public SendMoneyPage EnterRecipient(string walletId)   { Type(RecipientInput, walletId);   return this; }
    public SendMoneyPage EnterAmount(string amount)        { Type(AmountInput, amount);        return this; }
    public SendMoneyPage EnterDescription(string desc)     { Type(DescriptionInput, desc);     return this; }

    public SendMoneyPage SelectCurrency(string currency)
    {
        var select = new OpenQA.Selenium.Support.UI.SelectElement(Find(CurrencySelect));
        select.SelectByText(currency);
        return this;
    }

    public ConfirmTransferPage ClickReview()
    {
        Click(SubmitBtn);
        WaitForNavigation("/transfer/confirm");
        return new ConfirmTransferPage(Driver, Wait);
    }

    public SendMoneyPage ClickReviewExpectingError()
    {
        Click(SubmitBtn);
        Find(FormError);
        return this;
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public bool   HasFormError  => IsDisplayed(FormError);
    public string FormErrorText => Exists(FormError) ? GetText(FormError) : string.Empty;
}
