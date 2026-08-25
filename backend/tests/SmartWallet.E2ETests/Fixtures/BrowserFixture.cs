using SmartWallet.E2ETests.Infrastructure;

namespace SmartWallet.E2ETests.Fixtures;

/// <summary>
/// Manages a single browser instance for a test class.
/// Implement IAsyncLifetime so xUnit calls InitializeAsync before any test
/// and DisposeAsync after all tests in the class complete.
/// </summary>
public class BrowserFixture : IAsyncLifetime
{
    public IWebDriver     Driver   { get; private set; } = null!;
    public WebDriverWait  Wait     { get; private set; } = null!;
    public TestSettings   Settings { get; private set; } = null!;

    public Task InitializeAsync()
    {
        Settings = TestSettings.Load();
        Driver   = BrowserFactory.Create(Settings);
        Wait     = new WebDriverWait(Driver, TimeSpan.FromSeconds(Settings.ExplicitWaitSeconds));

        Driver.Manage().Window.Maximize();
        Driver.Manage().Timeouts().ImplicitWait = TimeSpan.Zero; // always use explicit waits

        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        Driver?.Quit();
        Driver?.Dispose();
        return Task.CompletedTask;
    }

    public void NavigateTo(string path = "")
        => Driver.Navigate().GoToUrl($"{Settings.BaseUrl}/{path.TrimStart('/')}");

    public string TakeScreenshot(string testName)
        => Driver.TakeScreenshot(testName, Settings.ScreenshotPath);
}
