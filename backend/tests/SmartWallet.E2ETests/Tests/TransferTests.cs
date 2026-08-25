using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Infrastructure;
using SmartWallet.E2ETests.Pages.Auth;
using SmartWallet.E2ETests.Pages.Transfer;
using SmartWallet.E2ETests.Pages.Wallet;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for the transfer (send money) flow.
/// Creates a second "recipient" user each test run to enable real transfers.
/// </summary>
[Collection("Browser")]
public class TransferTests : BaseTest, IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;

    public TransferTests(AuthFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
        _auth = fixture;
    }

    /// <summary>
    /// Registers a second user, reads their wallet ID, then switches back to the primary user.
    /// Returns the recipient's wallet ID.
    /// </summary>
    private string SetupRecipientAndGetWalletId()
    {
        var recipientEmail = TestDataBuilder.UniqueEmail("recipient");
        var recipientName  = TestDataBuilder.FullName("Recipient");

        // Register recipient
        Fixture.NavigateTo("/auth/register");
        new RegisterPage(Driver, Wait)
            .Register(recipientName, recipientEmail, TestDataBuilder.Password)
            .WaitForLoad();

        // Read their wallet ID
        Fixture.NavigateTo("/wallet");
        var walletId = new WalletPage(Driver, Wait).WalletIdText;
        Log($"Recipient wallet ID: {walletId}");

        // Log back in as primary user
        Fixture.NavigateTo("/auth/login");
        new LoginPage(Driver, Wait).Login(_auth.UserEmail, _auth.Password).WaitForLoad();

        // Deposit so the sender has funds
        Fixture.NavigateTo("/wallet/deposit");
        new DepositPage(Driver, Wait).EnterAmount("500").Submit().WaitForLoad();

        return walletId;
    }

    private SendMoneyPage GoToSendMoney()
    {
        Fixture.NavigateTo("/transfer");
        return new SendMoneyPage(Driver, Wait);
    }

    // ── Happy path ────────────────────────────────────────────────────────

    [Fact]
    public void Transfer_ValidRecipientAndAmount_Succeeds()
    {
        RunTest(nameof(Transfer_ValidRecipientAndAmount_Succeeds), () =>
        {
            var recipientWalletId = SetupRecipientAndGetWalletId();

            var confirmPage = GoToSendMoney()
                .EnterRecipient(recipientWalletId)
                .EnterAmount("50")
                .ClickReview()
                .WaitForLoad();

            confirmPage.Confirm();

            Assert.True(confirmPage.IsSuccess, "Transfer should complete successfully");
        });
    }

    [Fact]
    public void Transfer_Success_ShowsAmountOnConfirmPage()
    {
        RunTest(nameof(Transfer_Success_ShowsAmountOnConfirmPage), () =>
        {
            var recipientWalletId = SetupRecipientAndGetWalletId();

            var confirmPage = GoToSendMoney()
                .EnterRecipient(recipientWalletId)
                .EnterAmount("75")
                .ClickReview()
                .WaitForLoad();

            Assert.False(string.IsNullOrWhiteSpace(confirmPage.AmountText),
                "Confirm page should display the transfer amount");

            confirmPage.Confirm();
            Assert.True(confirmPage.IsSuccess);
        });
    }

    [Fact]
    public void Transfer_Success_CanViewInTransactionList()
    {
        RunTest(nameof(Transfer_Success_CanViewInTransactionList), () =>
        {
            var recipientWalletId = SetupRecipientAndGetWalletId();

            var txList = GoToSendMoney()
                .EnterRecipient(recipientWalletId)
                .EnterAmount("30")
                .ClickReview()
                .WaitForLoad()
                .Confirm()
                .ViewTransactions()
                .WaitForLoad();

            Assert.True(txList.HasRows, "Transaction list should have at least one row after transfer");
        });
    }

    // ── Validation errors ─────────────────────────────────────────────────

    [Fact]
    public void Transfer_EmptyRecipient_ShowsError()
    {
        RunTest(nameof(Transfer_EmptyRecipient_ShowsError), () =>
        {
            var sendPage = GoToSendMoney()
                .EnterAmount("50")
                .ClickReviewExpectingError();

            Assert.True(sendPage.HasFormError, "Empty recipient should show error");
        });
    }

    [Fact]
    public void Transfer_InvalidWalletId_ShowsError()
    {
        RunTest(nameof(Transfer_InvalidWalletId_ShowsError), () =>
        {
            var sendPage = GoToSendMoney()
                .EnterRecipient("INVALID-WALLET-000")
                .EnterAmount("50")
                .ClickReviewExpectingError();

            Assert.True(sendPage.HasFormError, "Invalid wallet ID should show error");
        });
    }

    [Fact]
    public void Transfer_ZeroAmount_ShowsError()
    {
        RunTest(nameof(Transfer_ZeroAmount_ShowsError), () =>
        {
            var sendPage = GoToSendMoney()
                .EnterRecipient("any-wallet-id")
                .EnterAmount("0")
                .ClickReviewExpectingError();

            Assert.True(sendPage.HasFormError, "Zero amount should show error");
        });
    }

    [Fact]
    public void Transfer_EmptyAmount_ShowsError()
    {
        RunTest(nameof(Transfer_EmptyAmount_ShowsError), () =>
        {
            var sendPage = GoToSendMoney()
                .EnterRecipient("any-wallet-id")
                .ClickReviewExpectingError();

            Assert.True(sendPage.HasFormError, "Empty amount should show error");
        });
    }

    // ── Cancel flow ───────────────────────────────────────────────────────

    [Fact]
    public void Transfer_CancelOnConfirmPage_ReturnToTransferForm()
    {
        RunTest(nameof(Transfer_CancelOnConfirmPage_ReturnToTransferForm), () =>
        {
            var recipientWalletId = SetupRecipientAndGetWalletId();

            GoToSendMoney()
                .EnterRecipient(recipientWalletId)
                .EnterAmount("10")
                .ClickReview()
                .WaitForLoad()
                .Cancel();

            Assert.Contains("/transfer", Driver.Url);
        });
    }

    // ── With description ──────────────────────────────────────────────────

    [Fact]
    public void Transfer_WithDescription_Succeeds()
    {
        RunTest(nameof(Transfer_WithDescription_Succeeds), () =>
        {
            var recipientWalletId = SetupRecipientAndGetWalletId();

            var confirmPage = GoToSendMoney()
                .EnterRecipient(recipientWalletId)
                .EnterAmount("25")
                .EnterDescription("Test payment E2E")
                .ClickReview()
                .WaitForLoad();

            confirmPage.Confirm();
            Assert.True(confirmPage.IsSuccess);
        });
    }
}
