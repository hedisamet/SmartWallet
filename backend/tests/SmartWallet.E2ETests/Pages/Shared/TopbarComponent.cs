using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Pages.Wallet;

namespace SmartWallet.E2ETests.Pages.Shared;

public class TopbarComponent : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By NotificationsBtn = By.Id("notifications-btn");
    private static readonly By NotifDot         = By.CssSelector(".notif-dot");
    private static readonly By DepositBtn       = By.Id("topbar-deposit-btn");
    private static readonly By AvatarBtn        = By.Id("topbar-avatar-btn");
    private static readonly By ProfileLink      = By.CssSelector("[routerLink='/profile'], a[href='/profile']");
    private static readonly By SignOutBtn        = By.CssSelector(".dropdown-item.text-danger");
    private static readonly By ConfirmSignOut    = By.CssSelector("app-confirm-modal .btn--danger");

    public TopbarComponent(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public NotificationDrawerComponent OpenNotifications()
    {
        Click(NotificationsBtn);
        return new NotificationDrawerComponent(Driver, Wait);
    }

    public DepositPage ClickQuickDeposit()
    {
        Click(DepositBtn);
        WaitForNavigation("/wallet/deposit");
        return new DepositPage(Driver, Wait);
    }

    public void OpenProfileMenu() => Click(AvatarBtn);

    public void Logout()
    {
        OpenProfileMenu();
        Click(SignOutBtn);
        Click(ConfirmSignOut);
        WaitForNavigation("/auth/login");
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public bool HasUnreadIndicator => IsDisplayed(NotifDot);
}
