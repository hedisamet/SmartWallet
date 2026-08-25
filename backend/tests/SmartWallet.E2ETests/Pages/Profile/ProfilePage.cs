using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Profile;

public class ProfilePage : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By FullNameInput     = By.Id("fullName-profile");
    private static readonly By EmailInput        = By.Id("email-profile");
    private static readonly By SaveProfileBtn    = By.Id("save-profile-btn");
    private static readonly By CurrentPwdInput   = By.Id("current-pwd");
    private static readonly By NewPwdInput       = By.Id("new-pwd");
    private static readonly By ConfirmPwdInput   = By.Id("confirm-pwd");
    private static readonly By ChangePwdBtn      = By.Id("change-pwd-btn");
    private static readonly By LogoutBtn         = By.Id("logout-all-btn");
    private static readonly By FormError         = By.CssSelector(".form-error");
    private static readonly By SuccessToast      = By.CssSelector(".toast--success");

    public ProfilePage(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public ProfilePage WaitForLoad()
    {
        Find(FullNameInput);
        return this;
    }

    public ProfilePage UpdateFullName(string name)
    {
        Type(FullNameInput, name);
        return this;
    }

    public ProfilePage SaveProfile()
    {
        Click(SaveProfileBtn);
        Find(SuccessToast);
        return this;
    }

    public ProfilePage ChangePassword(string current, string newPwd, string confirm)
    {
        Type(CurrentPwdInput, current);
        Type(NewPwdInput, newPwd);
        Type(ConfirmPwdInput, confirm);
        Click(ChangePwdBtn);
        return this;
    }

    public void LogoutAll()
    {
        Click(LogoutBtn);
        WaitForNavigation("/auth/login");
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public string FullNameValue => GetValue(FullNameInput);
    public string EmailValue    => GetValue(EmailInput);
    public bool   HasFormError  => IsDisplayed(FormError);
}
