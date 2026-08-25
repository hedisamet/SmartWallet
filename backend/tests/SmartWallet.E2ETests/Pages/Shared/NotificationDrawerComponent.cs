using SmartWallet.E2ETests.Base;

namespace SmartWallet.E2ETests.Pages.Shared;

public class NotificationDrawerComponent : BasePage
{
    // ── Locators ───────────────────────────────────────────────────────
    private static readonly By Panel        = By.CssSelector(".nd-panel.nd-panel--open");
    private static readonly By CloseBtn     = By.CssSelector(".nd-btn-close");
    private static readonly By MarkAllBtn   = By.CssSelector(".nd-btn-markall");
    private static readonly By TabAll       = By.XPath("//button[contains(@class,'nd-tab') and normalize-space()='All']");
    private static readonly By TabUnread    = By.XPath("//button[contains(@class,'nd-tab') and contains(.,'Unread')]");
    private static readonly By Items        = By.CssSelector(".nd-item");
    private static readonly By UnreadItems  = By.CssSelector(".nd-item.nd-item--unread");
    private static readonly By GroupLabels  = By.CssSelector(".nd-group-label");
    private static readonly By EmptyState   = By.CssSelector(".nd-empty");

    public NotificationDrawerComponent(IWebDriver driver, WebDriverWait wait) : base(driver, wait) { }

    // ── Actions ────────────────────────────────────────────────────────

    public NotificationDrawerComponent WaitForOpen()
    {
        Find(Panel);
        return this;
    }

    public void Close() => Click(CloseBtn);

    public NotificationDrawerComponent SwitchToAll()    { Click(TabAll);    return this; }
    public NotificationDrawerComponent SwitchToUnread() { Click(TabUnread); return this; }

    public void MarkAllAsRead()
    {
        if (Exists(MarkAllBtn)) Click(MarkAllBtn);
    }

    public void MarkFirstUnreadAsRead()
    {
        var items = FindAll(UnreadItems);
        items.First().Click();
    }

    // ── Assertions ─────────────────────────────────────────────────────

    public bool IsOpen         => IsDisplayed(Panel);
    public int  ItemCount      => FindAll(Items).Count;
    public int  UnreadCount    => FindAll(UnreadItems).Count;
    public bool IsEmpty        => IsDisplayed(EmptyState);
    public bool HasMarkAllBtn  => IsDisplayed(MarkAllBtn);

    public IReadOnlyList<string> GetNotificationTitles()
        => FindAll(By.CssSelector(".nd-item__title"))
           .Select(e => e.Text)
           .ToList();

    public IReadOnlyList<string> GetNotificationMessages()
        => FindAll(By.CssSelector(".nd-item__msg"))
           .Select(e => e.Text)
           .ToList();
}
