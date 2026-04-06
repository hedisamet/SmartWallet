using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.Application.Wallets.Commands;

public record DepositCommand(
    Guid    UserId,
    decimal Amount,
    string  Currency,
    Guid    IdempotencyKey
) : IRequest<Result<DepositResponse>>;

public record DepositResponse(
    Guid    TransactionId,
    decimal NewBalance,
    string  Currency,
    DateTime CompletedAt
);

public class DepositCommandHandler : IRequestHandler<DepositCommand, Result<DepositResponse>>
{
    private readonly IWalletRepository      _walletRepo;
    private readonly ITransactionRepository _transactionRepo;
    private readonly IUnitOfWork            _unitOfWork;

    public DepositCommandHandler(
        IWalletRepository      walletRepo,
        ITransactionRepository transactionRepo,
        IUnitOfWork            unitOfWork)
    {
        _walletRepo      = walletRepo;
        _transactionRepo = transactionRepo;
        _unitOfWork      = unitOfWork;
    }

    public async Task<Result<DepositResponse>> Handle(
        DepositCommand    command,
        CancellationToken ct)
    {
        // Idempotency check
        var existing = await _transactionRepo
            .FindByIdempotencyKeyAsync(command.IdempotencyKey, ct);

        if (existing is not null)
        {
            return Result<DepositResponse>.Success(new DepositResponse(
                existing.Id,
                0m,
                existing.Currency,
                existing.CompletedAt ?? existing.CreatedAt
            ));
        }

        try
        {
            await _unitOfWork.BeginTransactionAsync(ct);

            var wallet = await _walletRepo
                .GetByUserIdWithLockAsync(command.UserId, ct);

            if (wallet is null)
            {
                await _unitOfWork.RollbackAsync(ct);
                return Result<DepositResponse>.Failure("Wallet not found.");
            }

            var currency = Currency.From(command.Currency);
            var money    = Money.Of(command.Amount, currency);

            wallet.Deposit(money);

            var transaction = Domain.Entities.Transaction.Create(
                idempotencyKey   : command.IdempotencyKey,
                senderWalletId   : wallet.Id,
                receiverWalletId : wallet.Id,
                amount           : money.Value,
                currency         : currency.Code,
                type             : Domain.Entities.TransactionType.Deposit
            );

            await _transactionRepo.AddAsync(transaction, ct);
            transaction.MarkSuccess();
            _transactionRepo.Update(transaction);

            await _unitOfWork.CommitAsync(ct);

            return Result<DepositResponse>.Success(new DepositResponse(
                transaction.Id,
                wallet.Balance,
                currency.Code,
                transaction.CompletedAt!.Value
            ));
        }
        catch (DomainException ex)
        {
            await _unitOfWork.RollbackAsync(ct);
            return Result<DepositResponse>.Failure(ex.Message);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(ct);
            throw;
        }
    }
}