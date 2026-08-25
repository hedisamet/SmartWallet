using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Dashboard;

namespace SmartWallet.E2ETests.Pages.Auth;

public class LoginPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By EmailInput    = By.Id("email");
    private static readonly By PasswordInput = By.Id("password");
    private static readonly By SubmitButton  = By.Id("login-submit");
    private static readonly By FormError     = By.CssSelector(".form-error");
    private static readonly By ServerError   = By.CssSelector(".toast--error");
    private static readonly By GoRegister    = By.Id("go-register");

    public LoginPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public LoginPage EnterEmail(string email)       { Type(EmailInput, email);       return this; }
    public LoginPage EnterPassword(string password) { Type(PasswordInput, password); return this; }

    public DashboardPage ClickSignIn()
    {
        Click(SubmitButton);
        WaitForNavigation("/dashboard");
        return new DashboardPage(Driver, Wait);
    }

    /// <summary>
    /// Submits the form expecting failure. Waits for either a client-side
    /// form error or a server-side error toast — whichever appears first.
    /// </summary>
    public LoginPage ClickSignInExpectingError()
    {
        Click(SubmitButton);
        WaitForAnyError(FormError, ServerError);
        return this;
    }

    /// <summary>Full login flow in one call.</summary>
    public DashboardPage Login(string email, string password)
        => EnterEmail(email).EnterPassword(password).ClickSignIn();

    public void GoToRegister() => Click(GoRegister);

    // ── Assertions ─────────────────────────────────────────────────────

    public bool HasFormError   => IsDisplayed(FormError);
    public bool HasServerError => IsDisplayed(ServerError);
    public bool HasAnyError    => HasFormError || HasServerError;

    public string FormErrorText   => Exists(FormError)   ? GetText(FormError)   : string.Empty;
    public string ServerErrorText => Exists(ServerError) ? GetText(ServerError) : string.Empty;
}
