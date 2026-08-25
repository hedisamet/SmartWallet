using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Dashboard;

namespace SmartWallet.E2ETests.Pages.Auth;

public class RegisterPage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By FullNameInput = By.Id("fullName");
    private static readonly By EmailInput    = By.Id("reg-email");
    private static readonly By PasswordInput = By.Id("reg-password");
    private static readonly By SubmitButton  = By.Id("register-submit");
    private static readonly By FormError     = By.CssSelector(".form-error");
    private static readonly By ServerError   = By.CssSelector(".toast--error");
    private static readonly By GoLogin       = By.Id("go-login");
    private static readonly By StrengthText  = By.CssSelector(".strength-text");

    public RegisterPage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public RegisterPage EnterFullName(string name)     { Type(FullNameInput, name);     return this; }
    public RegisterPage EnterEmail(string email)       { Type(EmailInput, email);       return this; }
    public RegisterPage EnterPassword(string password) { Type(PasswordInput, password); return this; }

    public DashboardPage ClickRegister()
    {
        Click(SubmitButton);
        WaitForNavigation("/dashboard");
        return new DashboardPage(Driver, Wait);
    }

    /// <summary>
    /// Submits the form expecting failure. Waits for either a client-side
    /// form error or a server-side error toast — whichever appears first.
    /// </summary>
    public RegisterPage ClickRegisterExpectingError()
    {
        Click(SubmitButton);
        WaitForAnyError(FormError, ServerError);
        return this;
    }

    /// <summary>Full registration flow in one call.</summary>
    public DashboardPage Register(string fullName, string email, string password)
        => EnterFullName(fullName).EnterEmail(email).EnterPassword(password).ClickRegister();

    public void GoToLogin() => Click(GoLogin);

    // ── Assertions ─────────────────────────────────────────────────────

    public bool HasFormError   => IsDisplayed(FormError);
    public bool HasServerError => IsDisplayed(ServerError);
    public bool HasAnyError    => HasFormError || HasServerError;

    public string FormErrorText     => Exists(FormError)   ? GetText(FormError)   : string.Empty;
    public string ServerErrorText   => Exists(ServerError) ? GetText(ServerError) : string.Empty;
    public string PasswordStrength  => Exists(StrengthText) ? GetText(StrengthText) : string.Empty;
}
