using Microsoft.Extensions.Configuration;

namespace SmartWallet.E2ETests.Infrastructure;

public sealed class TestSettings
{
    public string BaseUrl           { get; init; } = "http://localhost:4200";
    public string Browser           { get; init; } = "Chrome";
    public bool   Headless          { get; init; } = false;
    public int    ExplicitWaitSeconds { get; init; } = 10;
    public string ScreenshotPath    { get; init; } = "Screenshots";
    public string TestUserPassword  { get; init; } = "E2eTest@123";

    public static TestSettings Load()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.test.json", optional: false)
            .Build();

        var settings = new TestSettings();
        config.GetSection("TestSettings").Bind(settings);
        return settings;
    }
}
