using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace SmartWallet.E2ETests.Infrastructure;

public static class BrowserFactory
{
    public static IWebDriver Create(TestSettings settings)
    {
        return settings.Browser.ToUpperInvariant() switch
        {
            "FIREFOX" => CreateFirefox(settings.Headless),
            _         => CreateChrome(settings.Headless)
        };
    }

    private static IWebDriver CreateChrome(bool headless)
    {
        new DriverManager().SetUpDriver(new ChromeConfig(), VersionResolveStrategy.MatchingBrowser);

        var options = new ChromeOptions();
        options.AddArgument("--no-sandbox");
        options.AddArgument("--disable-dev-shm-usage");
        options.AddArgument("--disable-gpu");
        options.AddArgument("--window-size=1440,900");

        if (headless)
        {
            options.AddArgument("--headless=new");
        }

        return new ChromeDriver(options);
    }

    private static IWebDriver CreateFirefox(bool headless)
    {
        new DriverManager().SetUpDriver(new FirefoxConfig(), VersionResolveStrategy.MatchingBrowser);

        var options = new FirefoxOptions();
        if (headless) options.AddArgument("--headless");

        return new FirefoxDriver(options);
    }
}
