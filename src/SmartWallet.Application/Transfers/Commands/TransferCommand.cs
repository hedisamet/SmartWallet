using MediatR;
using SmartWallet.Application.Common;
using SmartWallet.Application.Interfaces;
using SmartWallet.Domain.Entities;
using SmartWallet.Domain.Exceptions;
using SmartWallet.Domain.ValueObjects;

namespace SmartWallet.Application.Transfers.Commands;

public record TransferCommand(
    Guid    SenderId,
    Guid    ReceiverWalletId,
    decimal Amount,
    string  Currency,
    Guid    IdempotencyKey,
    string? Description
) : IRequest<Result<TransferResponse>>;

public record TransferResponse(
    Guid     TransactionId,
    decimal  Amount,
    string   Currency,
    string   Status,
    DateTime CompletedAt
);

public class TransferCommandHandler
    : IRequestHandler<TransferCommand, Result<TransferResponse>>
{
    private readonly IWalletRepository      _walletRepo;
    private readonly ITransactionRepository _transactionRepo;
    private readonly IUnitOfWork            _unitOfWork;

    public TransferCommandHandler(
        IWalletRepository      walletRepo,
        ITransactionRepository transactionRepo,
        IUnitOfWork            unitOfWork)
    {
        _walletRepo      = walletRepo;
        _transactionRepo = transactionRepo;
        _unitOfWork      = unitOfWork;
    }

    public async Task<Result<TransferResponse>> Handle(
        TransferCommand   command,
        CancellationToken ct)
    {
        // STEP 1 — idempotency check before anything else
        var existing = await _transactionRepo
            .FindByIdempotencyKeyAsync(command.IdempotencyKey, ct);

        if (existing is not null)
        {
            return Result<TransferResponse>.Success(new TransferResponse(
                existing.Id,
                existing.Amount,
                existing.Currency,
                existing.Status.ToString(),
                existing.CompletedAt ?? existing.CreatedAt
            ));
        }

        // STEP 2 — load wallets
        var senderWallet = await _walletRepo.GetByUserIdAsync(command.SenderId, ct);
        if (senderWallet is null)
            return Result<TransferResponse>.Failure("Sender wallet not found.");

        var receiverWallet = await _walletRepo.GetByIdAsync(command.ReceiverWalletId, ct);
        if (receiverWallet is null)
            return Result<TransferResponse>.Failure("Receiver wallet not found.");

        // STEP 3 — no self-transfer
        if (senderWallet.Id == receiverWallet.Id)
            return Result<TransferResponse>.Failure("Cannot transfer to the same wallet.");

        // STEP 4 — build domain objects
        var currency = Currency.From(command.Currency);
        var money    = Money.Of(command.Amount, currency);

        // STEP 5 — record intent as PENDING before acquiring locks
        var transaction = Transaction.Create(
            idempotencyKey   : command.IdempotencyKey,
            senderWalletId   : senderWallet.Id,
            receiverWalletId : receiverWallet.Id,
            amount           : money.Value,
            currency         : currency.Code,
            type             : TransactionType.Transfer,
            description      : command.Description
        );

        await _transactionRepo.AddAsync(transaction, ct);

        // STEP 6 — atomic scope
        try
        {
            await _unitOfWork.BeginTransactionAsync(ct);

            // Re-fetch with row-level lock — prevents concurrent balance reads
            var lockedSender   = await _walletRepo.GetByIdWithLockAsync(senderWallet.Id, ct);
            var lockedReceiver  = await _walletRepo.GetByIdWithLockAsync(receiverWallet.Id, ct);

            lockedSender!.Debit(money);
            lockedReceiver!.Credit(money);

            transaction.MarkSuccess();

            _walletRepo.Update(lockedSender);
            _walletRepo.Update(lockedReceiver);
            _transactionRepo.Update(transaction);

            await _unitOfWork.CommitAsync(ct);

            return Result<TransferResponse>.Success(new TransferResponse(
                transaction.Id,
                transaction.Amount,
                transaction.Currency,
                transaction.Status.ToString(),
                transaction.CompletedAt!.Value
            ));
        }
        catch (DomainException ex)
        {
            await _unitOfWork.RollbackAsync(ct);
            transaction.MarkFailed(ex.Message);
            _transactionRepo.Update(transaction);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result<TransferResponse>.Failure(ex.Message);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(ct);
            transaction.MarkFailed("Unexpected system error.");
            _transactionRepo.Update(transaction);
            await _unitOfWork.SaveChangesAsync(ct);

            throw;
        }
    }
}