using OpenQA.Selenium.Interactions;

namespace SmartWallet.E2ETests.Infrastructure;

public static class WebDriverExtensions
{
    // ── Waits ──────────────────────────────────────────────────────────

    public static IWebElement WaitForVisible(this WebDriverWait wait, By locator)
        => wait.Until(d =>
        {
            var el = d.FindElements(locator).FirstOrDefault();
            return el is { Displayed: true } ? el : null;
        })!;

    public static IWebElement WaitForClickable(this WebDriverWait wait, By locator)
        => wait.Until(d =>
        {
            var el = d.FindElements(locator).FirstOrDefault();
            return el is { Displayed: true, Enabled: true } ? el : null;
        })!;

    public static bool WaitForUrl(this WebDriverWait wait, string urlFragment)
        => wait.Until(d => d.Url.Contains(urlFragment, StringComparison.OrdinalIgnoreCase));

    public static bool WaitForUrlExact(this WebDriverWait wait, string url)
        => wait.Until(d => string.Equals(d.Url, url, StringComparison.OrdinalIgnoreCase));

    public static bool WaitForElementGone(this WebDriverWait wait, By locator)
        => wait.Until(d =>
        {
            var els = d.FindElements(locator);
            return els.Count == 0 || !els[0].Displayed;
        });

    public static bool WaitForText(this WebDriverWait wait, By locator, string text)
        => wait.Until(d =>
        {
            try { return d.FindElement(locator).Text.Contains(text, StringComparison.OrdinalIgnoreCase); }
            catch (NoSuchElementException) { return false; }
        });

    // ── Safe interactions ──────────────────────────────────────────────

    public static void SafeClick(this WebDriverWait wait, By locator)
        => wait.WaitForClickable(locator).Click();

    public static void SafeType(this WebDriverWait wait, By locator, string text)
    {
        var el = wait.WaitForVisible(locator);
        el.Clear();
        el.SendKeys(text);
    }

    public static string SafeGetText(this WebDriverWait wait, By locator)
        => wait.WaitForVisible(locator).Text;

    public static string SafeGetValue(this WebDriverWait wait, By locator)
        => wait.WaitForVisible(locator).GetDomProperty("value") ?? string.Empty;

    // ── Screenshots ────────────────────────────────────────────────────

    public static string TakeScreenshot(this IWebDriver driver, string name, string folder)
    {
        Directory.CreateDirectory(folder);
        var path = Path.Combine(folder, $"{name}_{DateTime.Now:yyyyMMdd_HHmmss}.png");
        ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(path);
        return path;
    }

    // ── JavaScript helpers ─────────────────────────────────────────────

    public static void ScrollIntoView(this IWebDriver driver, IWebElement element)
        => ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].scrollIntoView(true);", element);

    public static void JsClick(this IWebDriver driver, IWebElement element)
        => ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].click();", element);

    // ── Element existence ──────────────────────────────────────────────

    public static bool ElementExists(this IWebDriver driver, By locator)
        => driver.FindElements(locator).Count > 0;

    public static bool ElementIsDisplayed(this IWebDriver driver, By locator)
    {
        try { return driver.FindElement(locator).Displayed; }
        catch (NoSuchElementException) { return false; }
    }
}
