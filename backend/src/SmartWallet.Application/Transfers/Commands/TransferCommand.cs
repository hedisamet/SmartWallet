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
    private readonly INotificationService   _notificationService;
    private readonly IUnitOfWork            _unitOfWork;
    private readonly IUserRepository        _userRepo;

    public TransferCommandHandler(
        IWalletRepository      walletRepo,
        ITransactionRepository transactionRepo,
        INotificationService   notificationService,
        IUnitOfWork            unitOfWork,
        IUserRepository        userRepo)
    {
        _walletRepo          = walletRepo;
        _transactionRepo     = transactionRepo;
        _notificationService = notificationService;
        _unitOfWork          = unitOfWork;
        _userRepo            = userRepo;
    }

    public async Task<Result<TransferResponse>> Handle(
        TransferCommand   command,
        CancellationToken ct)
    {
        // STEP 1 — idempotency check
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

        // STEP 2 — begin transaction FIRST, then load with locks
        try
        {
            await _unitOfWork.BeginTransactionAsync(ct);

            var senderWallet = await _walletRepo
                .GetByUserIdWithLockAsync(command.SenderId, ct);

            if (senderWallet is null)
            {
                await _unitOfWork.RollbackAsync(ct);
                return Result<TransferResponse>.Failure("Sender wallet not found.");
            }

            var receiverWallet = await _walletRepo
                .GetByIdWithLockAsync(command.ReceiverWalletId, ct);

            if (receiverWallet is null)
            {
                await _unitOfWork.RollbackAsync(ct);
                return Result<TransferResponse>.Failure("Receiver wallet not found.");
            }

            // STEP 3 — no self-transfer
            if (senderWallet.Id == receiverWallet.Id)
            {
                await _unitOfWork.RollbackAsync(ct);
                return Result<TransferResponse>.Failure("Cannot transfer to the same wallet.");
            }

            // STEP 4 — build domain objects
            var currency = Currency.From(command.Currency);
            var money    = Money.Of(command.Amount, currency);

            // STEP 5 — record intent as PENDING
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

            // STEP 6 — mutate domain objects
            senderWallet.Debit(money);
            receiverWallet.Credit(money);

            transaction.MarkSuccess();

            _walletRepo.Update(senderWallet);
            _walletRepo.Update(receiverWallet);
            _transactionRepo.Update(transaction);

            await _unitOfWork.CommitAsync(ct);

            // Fetch names for notification (optional but better)
            var senderUser = await _userRepo.GetByIdAsync(command.SenderId, ct);

            // NOTIFY SENDER
            await _notificationService.NotifyUserAsync(
                command.SenderId,
                "Transfer Sent",
                $"You successfully sent {money} to the recipient.",
                ct);

            // NOTIFY RECEIVER
            await _notificationService.NotifyUserAsync(
                receiverWallet.UserId,
                "Transfer Received",
                $"You received {money} from {senderUser?.FullName ?? "a user"}.",
                ct);

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
            return Result<TransferResponse>.Failure(ex.Message);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(ct);
            throw;
        }
    }
}