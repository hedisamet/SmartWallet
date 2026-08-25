using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Infrastructure;
using SmartWallet.E2ETests.Pages.Auth;
using SmartWallet.E2ETests.Pages.Dashboard;
using SmartWallet.E2ETests.Pages.Wallet;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for the notification drawer.
/// A transfer between two users generates a "received" notification on the recipient side.
/// </summary>
[Collection("Browser")]
public class NotificationTests : BaseTest, IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;

    public NotificationTests(AuthFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
        _auth = fixture;
    }

    /// <summary>
    /// Registers a recipient, returns to sender, sends money, then logs in as recipient.
    /// The recipient should have an unread notification.
    /// </summary>
    private void SeedTransferAndLoginAsRecipient(out string recipientEmail)
    {
        recipientEmail = TestDataBuilder.UniqueEmail("notif-recv");
        var recipientName = TestDataBuilder.FullName("NotifRecv");
        var password      = TestDataBuilder.Password;

        // Register recipient
        Fixture.NavigateTo("/auth/register");
        new RegisterPage(Driver, Wait)
            .Register(recipientName, recipientEmail, password)
            .WaitForLoad();

        Fixture.NavigateTo("/wallet");
        var recipientWalletId = new WalletPage(Driver, Wait).WalletIdText;
        Log($"Recipient wallet ID: {recipientWalletId}");

        // Login as primary sender
        Fixture.NavigateTo("/auth/login");
        new LoginPage(Driver, Wait)
            .Login(_auth.UserEmail, _auth.Password)
            .WaitForLoad();

        // Deposit funds
        Fixture.NavigateTo("/wallet/deposit");
        new DepositPage(Driver, Wait).EnterAmount("500").Submit().WaitForLoad();

        // Send money to recipient
        Fixture.NavigateTo("/transfer");
        new Pages.Transfer.SendMoneyPage(Driver, Wait)
            .EnterRecipient(recipientWalletId)
            .EnterAmount("100")
            .ClickReview()
            .WaitForLoad()
            .Confirm()
            .ViewTransactions()
            .WaitForLoad();

        // Now login as recipient who should have a notification
        Fixture.NavigateTo("/auth/login");
        new LoginPage(Driver, Wait)
            .Login(recipientEmail, password)
            .WaitForLoad();
    }

    // ── Drawer open/close ─────────────────────────────────────────────────

    [Fact]
    public void Notifications_OpenDrawer_DrawerIsVisible()
    {
        RunTest(nameof(Notifications_OpenDrawer_DrawerIsVisible), () =>
        {
            Fixture.NavigateTo("/dashboard");
            var dashboard = new DashboardPage(Driver, Wait).WaitForLoad();

            var drawer = dashboard.Topbar.OpenNotifications().WaitForOpen();
            Assert.True(drawer.IsOpen, "Notification drawer should be open");
        });
    }

    [Fact]
    public void Notifications_CloseDrawer_DrawerIsHidden()
    {
        RunTest(nameof(Notifications_CloseDrawer_DrawerIsHidden), () =>
        {
            Fixture.NavigateTo("/dashboard");
            var dashboard = new DashboardPage(Driver, Wait).WaitForLoad();

            var drawer = dashboard.Topbar.OpenNotifications().WaitForOpen();
            drawer.Close();

            Assert.False(drawer.IsOpen, "Notification drawer should be closed");
        });
    }

    // ── Receiving notifications ───────────────────────────────────────────

    [Fact]
    public void Notifications_AfterReceivingTransfer_ShowsUnreadIndicator()
    {
        RunTest(nameof(Notifications_AfterReceivingTransfer_ShowsUnreadIndicator), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var dashboard = new DashboardPage(Driver, Wait).WaitForLoad();

            Assert.True(dashboard.Topbar.HasUnreadIndicator,
                "Unread indicator should appear after receiving a transfer");
        });
    }

    [Fact]
    public void Notifications_AfterReceivingTransfer_DrawerShowsNotification()
    {
        RunTest(nameof(Notifications_AfterReceivingTransfer_DrawerShowsNotification), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            Assert.True(drawer.ItemCount > 0, "Drawer should have at least one notification");

            var titles = drawer.GetNotificationTitles();
            Assert.NotEmpty(titles);
            Log($"Notification titles: {string.Join(", ", titles)}");
        });
    }

    [Fact]
    public void Notifications_AfterReceivingTransfer_UnreadCountIsPositive()
    {
        RunTest(nameof(Notifications_AfterReceivingTransfer_UnreadCountIsPositive), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            Assert.True(drawer.UnreadCount > 0, "Should have unread notifications");
        });
    }

    // ── Mark as read ──────────────────────────────────────────────────────

    [Fact]
    public void Notifications_MarkAllAsRead_ClearsUnreadCount()
    {
        RunTest(nameof(Notifications_MarkAllAsRead_ClearsUnreadCount), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            var unreadBefore = drawer.UnreadCount;
            Log($"Unread before: {unreadBefore}");

            drawer.MarkAllAsRead();

            Assert.Equal(0, drawer.UnreadCount);
        });
    }

    [Fact]
    public void Notifications_MarkFirstAsRead_DecreasesUnreadCount()
    {
        RunTest(nameof(Notifications_MarkFirstAsRead_DecreasesUnreadCount), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            var unreadBefore = drawer.UnreadCount;
            Assert.True(unreadBefore > 0, "Need at least one unread to mark");

            drawer.MarkFirstUnreadAsRead();

            Assert.True(drawer.UnreadCount < unreadBefore,
                "Unread count should decrease after marking one as read");
        });
    }

    // ── Filter tabs ───────────────────────────────────────────────────────

    [Fact]
    public void Notifications_SwitchToUnreadTab_ShowsOnlyUnread()
    {
        RunTest(nameof(Notifications_SwitchToUnreadTab_ShowsOnlyUnread), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen()
                .SwitchToUnread();

            Assert.True(drawer.ItemCount > 0, "Unread tab should show unread items");
            Assert.Equal(drawer.ItemCount, drawer.UnreadCount);
        });
    }

    [Fact]
    public void Notifications_AfterMarkAllRead_UnreadTabShowsEmpty()
    {
        RunTest(nameof(Notifications_AfterMarkAllRead_UnreadTabShowsEmpty), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            drawer.MarkAllAsRead();
            drawer.SwitchToUnread();

            Assert.True(drawer.IsEmpty, "Unread tab should be empty after marking all as read");
        });
    }

    // ── Message content ───────────────────────────────────────────────────

    [Fact]
    public void Notifications_TransferReceived_MessageContainsAmount()
    {
        RunTest(nameof(Notifications_TransferReceived_MessageContainsAmount), () =>
        {
            SeedTransferAndLoginAsRecipient(out _);

            Fixture.NavigateTo("/dashboard");
            var drawer = new DashboardPage(Driver, Wait)
                .WaitForLoad()
                .Topbar
                .OpenNotifications()
                .WaitForOpen();

            var messages = drawer.GetNotificationMessages();
            Assert.NotEmpty(messages);

            // Message should reference the transferred amount (100) not a raw C# object
            var firstMessage = messages[0];
            Log($"Notification message: {firstMessage}");
            Assert.DoesNotContain("{ Value =", firstMessage);
        });
    }
}
