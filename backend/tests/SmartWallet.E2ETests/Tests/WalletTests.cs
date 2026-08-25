using SmartWallet.E2ETests.Base;
using SmartWallet.E2ETests.Fixtures;
using SmartWallet.E2ETests.Pages.Wallet;
using Xunit.Abstractions;

namespace SmartWallet.E2ETests.Tests;

/// <summary>
/// Tests for wallet details and deposit flows.
/// Uses AuthFixture so the browser is already logged in.
/// </summary>
[Collection("Browser")]
public class WalletTests : BaseTest, IClassFixture<AuthFixture>
{
    private readonly AuthFixture _auth;

    public WalletTests(AuthFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
        _auth = fixture;
    }

    private DepositPage GoToDeposit()
    {
        Fixture.NavigateTo("/wallet/deposit");
        return new DepositPage(Driver, Wait);
    }

    private WalletPage GoToWallet()
    {
        Fixture.NavigateTo("/wallet");
        return new WalletPage(Driver, Wait);
    }

    // ── Wallet page ───────────────────────────────────────────────────────

    [Fact]
    public void Wallet_Loads_ShowsWalletId()
    {
        RunTest(nameof(Wallet_Loads_ShowsWalletId), () =>
        {
            var page = GoToWallet();

            Assert.NotEmpty(page.WalletIdText);
            Log($"Wallet ID: {page.WalletIdText}");
        });
    }

    [Fact]
    public void Wallet_Loads_ShowsBalance()
    {
        RunTest(nameof(Wallet_Loads_ShowsBalance), () =>
        {
            var page = GoToWallet();

            Assert.NotEmpty(page.BalanceText);
        });
    }

    // ── Deposit ───────────────────────────────────────────────────────────

    [Fact]
    public void Deposit_WithValidAmount_RedirectsToWallet()
    {
        RunTest(nameof(Deposit_WithValidAmount_RedirectsToWallet), () =>
        {
            var walletPage = GoToDeposit()
                .EnterAmount("50")
                .Submit();   // app navigates to /wallet on success

            walletPage.WaitForLoad();
            Assert.Contains("/wallet", Driver.Url);
        });
    }

    [Fact]
    public void Deposit_UsingQuickAmount_FillsAmountField()
    {
        RunTest(nameof(Deposit_UsingQuickAmount_FillsAmountField), () =>
        {
            var deposit = GoToDeposit()
                .ClickQuickAmount("100");

            Assert.Equal("100", deposit.AmountValue);
        });
    }

    [Fact]
    public void Deposit_WithZeroAmount_ShowsError()
    {
        RunTest(nameof(Deposit_WithZeroAmount_ShowsError), () =>
        {
            var deposit = GoToDeposit()
                .EnterAmount("0")
                .SubmitExpectingError();

            Assert.True(deposit.HasFormError, "Amount of 0 should fail validation");
        });
    }

    [Fact]
    public void Deposit_WithNegativeAmount_ShowsError()
    {
        RunTest(nameof(Deposit_WithNegativeAmount_ShowsError), () =>
        {
            var deposit = GoToDeposit()
                .EnterAmount("-50")
                .SubmitExpectingError();

            Assert.True(deposit.HasFormError, "Negative amount should fail validation");
        });
    }

    [Fact]
    public void Deposit_WithEmptyAmount_ShowsError()
    {
        RunTest(nameof(Deposit_WithEmptyAmount_ShowsError), () =>
        {
            var deposit = GoToDeposit()
                .SubmitExpectingError();

            Assert.True(deposit.HasFormError, "Empty amount should fail validation");
        });
    }

    [Fact]
    public void Deposit_SelectDifferentCurrency_UpdatesCurrencyDisplay()
    {
        RunTest(nameof(Deposit_SelectDifferentCurrency_UpdatesCurrencyDisplay), () =>
        {
            var deposit = GoToDeposit()
                .SelectCurrency("USD");

            // Currency symbol should reflect selection
            var symbol = deposit.SelectedCurrency;
            Assert.False(string.IsNullOrWhiteSpace(symbol), "Currency symbol should be displayed");
        });
    }

    [Fact]
    public void Deposit_MultipleDeposits_WalletBalanceIsShown()
    {
        RunTest(nameof(Deposit_MultipleDeposits_WalletBalanceIsShown), () =>
        {
            GoToDeposit().EnterAmount("200").Submit().WaitForLoad();
            GoToDeposit().EnterAmount("300").Submit().WaitForLoad();

            // After both deposits we land on /wallet — balance should be visible
            var walletPage = new WalletPage(Driver, Wait).WaitForLoad();
            Assert.NotEmpty(walletPage.BalanceText);
        });
    }
}
