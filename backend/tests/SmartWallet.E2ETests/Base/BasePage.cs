using SmartWallet.E2ETests.Infrastructure;

namespace SmartWallet.E2ETests.Base;

/// <summary>
/// Base class for all Page Objects.
/// Exposes Driver, Wait, and common page-level helpers.
/// </summary>
public abstract class BasePage
{
    protected readonly IWebDriver    Driver;
    protected readonly WebDriverWait Wait;

    protected BasePage(IWebDriver driver, WebDriverWait wait)
    {
        Driver = driver;
        Wait   = wait;
    }

    // ── Navigation ─────────────────────────────────────────────────────

    public string CurrentUrl => Driver.Url;

    public bool IsAt(string urlFragment)
        => Driver.Url.Contains(urlFragment, StringComparison.OrdinalIgnoreCase);

    public void WaitForNavigation(string urlFragment)
        => Wait.WaitForUrl(urlFragment);

    // ── Element finders (preferred over raw FindElement in subclasses) ──

    protected IWebElement Find(By locator)
        => Wait.WaitForVisible(locator);

    protected IWebElement FindClickable(By locator)
        => Wait.WaitForClickable(locator);

    protected IReadOnlyList<IWebElement> FindAll(By locator)
        => Driver.FindElements(locator);

    protected bool Exists(By locator)
        => Driver.ElementExists(locator);

    protected bool IsDisplayed(By locator)
        => Driver.ElementIsDisplayed(locator);

    // ── Interactions ───────────────────────────────────────────────────

    protected void Click(By locator)
        => Wait.SafeClick(locator);

    protected void Type(By locator, string text)
        => Wait.SafeType(locator, text);

    protected string GetText(By locator)
        => Wait.SafeGetText(locator);

    protected string GetValue(By locator)
        => Wait.SafeGetValue(locator);

    // ── Error helpers ──────────────────────────────────────────────────

    /// <summary>
    /// Waits until at least one of the given locators becomes visible.
    /// Used when a failure may produce either a client-side form error
    /// OR a server-side toast error.
    /// </summary>
    protected void WaitForAnyError(params By[] locators)
    {
        Wait.Until(d =>
        {
            foreach (var locator in locators)
            {
                var els = d.FindElements(locator);
                if (els.Count > 0 && els[0].Displayed) return true;
            }
            return false;
        });
    }

    // ── Page readiness ─────────────────────────────────────────────────

    protected void WaitForLoadingGone()
    {
        // Waits for Angular skeleton/spinner elements to disappear
        try
        {
            Wait.WaitForElementGone(By.CssSelector(".spinner, .skeleton, .shimmer-card"));
        }
        catch (WebDriverTimeoutException)
        {
            // Loading indicator may not appear at all — that's fine
        }
    }

    protected string PageTitle => Driver.Title;
}
