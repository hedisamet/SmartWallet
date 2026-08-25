using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Infrastructure;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Base;

/// <summary>
/// Base class for all test classes.
/// Injects the browser fixture and provides screenshot-on-failure support.
/// </summary>
public abstract class BaseTest
{
    protected readonly IWebDriver        Driver;
    protected readonly WebDriverWait     Wait;
    protected readonly TestSettings      Settings;
    protected readonly BrowserFixture    Fixture;
    protected readonly ITestOutputHelper Output;

    protected BaseTest(BrowserFixture fixture, ITestOutputHelper output)
    {
        Fixture  = fixture;
        Driver   = fixture.Driver;
        Wait     = fixture.Wait;
        Settings = fixture.Settings;
        Output   = output;
    }

    /// <summary>
    /// Wraps a test action; captures a screenshot automatically if it throws.
    /// Usage: await RunTest(() => { ... });
    /// </summary>
    protected void RunTest(string testName, Action test)
    {
        try
        {
            test();
        }
        catch (Exception ex)
        {
            var path = Fixture.TakeScreenshot(testName);
            Output.WriteLine($"[FAILURE] Screenshot saved: {path}");
            Output.WriteLine($"[FAILURE] {ex.Message}");
            throw;
        }
    }

    protected void Log(string message) => Output.WriteLine(message);
}
