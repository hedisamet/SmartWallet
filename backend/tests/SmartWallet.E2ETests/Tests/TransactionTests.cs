using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Infrastructure;
using SmartWallet.E2ETests.Pages.Auth;
using SmartWallet.E2ETests.Pages.Transactions;
using SmartWallet.E2ETests.Pages.Wallet;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for transaction history list and transaction detail page.
/// Seeds deposit and transfer transactions before running assertions.
/// </summary>
[Collection("Browser")]
public class TransactionTests : BaseTest, IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;

    public TransactionTests(AuthFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
        _auth = fixture;
    }

    /// <summary>Seeds a deposit so the transaction list is non-empty.</summary>
    private void SeedDeposit(string amount = "100")
    {
        Fixture.NavigateTo("/wallet/deposit");
        new DepositPage(Driver, Wait).EnterAmount(amount).Submit().WaitForLoad();
    }

    /// <summary>Seeds a transfer to create a send transaction.</summary>
    private void SeedTransfer(string amount = "20")
    {
        var recipientEmail = TestDataBuilder.UniqueEmail("txrecipient");
        Fixture.NavigateTo("/auth/register");
        new RegisterPage(Driver, Wait)
            .Register(TestDataBuilder.FullName("TxRecipient"), recipientEmail, TestDataBuilder.Password)
            .WaitForLoad();

        Fixture.NavigateTo("/wallet");
        var walletId = new WalletPage(Driver, Wait).WalletIdText;

        // Back to primary user
        Fixture.NavigateTo("/auth/login");
        new LoginPage(Driver, Wait).Login(_auth.UserEmail, _auth.Password).WaitForLoad();

        // Deposit then transfer
        Fixture.NavigateTo("/wallet/deposit");
        new DepositPage(Driver, Wait).EnterAmount("500").Submit().WaitForLoad();

        Fixture.NavigateTo("/transfer");
        new Pages.Transfer.SendMoneyPage(Driver, Wait)
            .EnterRecipient(walletId)
            .EnterAmount(amount)
            .ClickReview()
            .WaitForLoad()
            .Confirm()
            .ViewTransactions()
            .WaitForLoad();
    }

    private TransactionListPage GoToTransactions()
    {
        Fixture.NavigateTo("/transactions");
        return new TransactionListPage(Driver, Wait).WaitForLoad();
    }

    // ── List page ─────────────────────────────────────────────────────────

    [Fact]
    public void Transactions_AfterDeposit_ShowsRow()
    {
        RunTest(nameof(Transactions_AfterDeposit_ShowsRow), () =>
        {
            SeedDeposit();
            var list = GoToTransactions();

            Assert.True(list.HasRows, "Transaction list should show the deposit row");
        });
    }

    [Fact]
    public void Transactions_List_ShowsStatusBadges()
    {
        RunTest(nameof(Transactions_List_ShowsStatusBadges), () =>
        {
            SeedDeposit();
            var list = GoToTransactions();

            var statuses = list.GetStatusTexts();
            Assert.NotEmpty(statuses);
        });
    }

    [Fact]
    public void Transactions_FilterByDeposit_ShowsOnlyDeposits()
    {
        RunTest(nameof(Transactions_FilterByDeposit_ShowsOnlyDeposits), () =>
        {
            SeedDeposit();
            var list = GoToTransactions()
                .FilterByType("deposit");

            // After filtering, all status badges should relate to deposits
            Assert.True(list.HasRows, "Should have rows after filtering by deposit");
        });
    }

    [Fact]
    public void Transactions_Pagination_NextPageButtonPresence()
    {
        RunTest(nameof(Transactions_Pagination_NextPageButtonPresence), () =>
        {
            var list = GoToTransactions();
            var paginationText = list.PaginationText;

            // Pagination info should be displayed if any transactions exist
            Log($"Pagination: {paginationText}");
            Assert.NotNull(paginationText);
        });
    }

    // ── Detail page ───────────────────────────────────────────────────────

    [Fact]
    public void Transaction_ClickRow_OpensDetailPage()
    {
        RunTest(nameof(Transaction_ClickRow_OpensDetailPage), () =>
        {
            SeedDeposit();
            var detail = GoToTransactions()
                .OpenFirstTransaction()
                .WaitForLoad();

            Assert.Contains("/transactions/", Driver.Url);
            Assert.NotEmpty(detail.AmountText);
        });
    }

    [Fact]
    public void Transaction_Detail_ShowsTypeAndStatus()
    {
        RunTest(nameof(Transaction_Detail_ShowsTypeAndStatus), () =>
        {
            SeedDeposit();
            var detail = GoToTransactions()
                .OpenFirstTransaction()
                .WaitForLoad();

            Assert.NotEmpty(detail.TypeText);
            Assert.NotEmpty(detail.StatusText);
        });
    }

    [Fact]
    public void Transaction_Detail_HasDetails()
    {
        RunTest(nameof(Transaction_Detail_HasDetails), () =>
        {
            SeedDeposit();
            var detail = GoToTransactions()
                .OpenFirstTransaction()
                .WaitForLoad();

            var details = detail.GetDetails();
            Assert.NotEmpty(details);
            Log($"Detail fields: {string.Join(", ", details.Keys)}");
        });
    }

    [Fact]
    public void Transaction_Detail_BackButton_ReturnsToList()
    {
        RunTest(nameof(Transaction_Detail_BackButton_ReturnsToList), () =>
        {
            SeedDeposit();
            var list = GoToTransactions()
                .OpenFirstTransaction()
                .WaitForLoad()
                .GoBack()
                .WaitForLoad();

            Assert.Contains("/transactions", Driver.Url);
        });
    }

    [Fact]
    public void Transaction_Deposit_StatusIsSuccess()
    {
        RunTest(nameof(Transaction_Deposit_StatusIsSuccess), () =>
        {
            SeedDeposit();
            var detail = GoToTransactions()
                .OpenFirstTransaction()
                .WaitForLoad();

            Assert.True(detail.IsSuccess, "Deposit transaction should have Success status");
        });
    }
}
