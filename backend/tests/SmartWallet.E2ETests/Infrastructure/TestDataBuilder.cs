namespace SmartWallet.E2ETests.Infrastructure;

/// <summary>Generates unique test data per test run to avoid collisions.</summary>
public static class TestDataBuilder
{
    private static readonly string RunId = DateTime.Now.ToString("yyMMddHHmmss");

    public static string UniqueEmail(string prefix = "user")
        => $"e2e_{prefix}_{RunId}_{Guid.NewGuid().ToString("N")[..6]}@test.com";

    public static string FullName(string prefix = "Test") => $"{prefix} User {RunId}";

    public static string Password => "E2eTest@123";
}
