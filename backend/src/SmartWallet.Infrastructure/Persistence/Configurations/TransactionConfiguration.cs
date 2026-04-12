using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.IdempotencyKey)
            .HasColumnName("idempotency_key")
            .IsRequired();

        // This unique constraint is the hard DB-level idempotency guard
        builder.HasIndex(t => t.IdempotencyKey)
            .IsUnique()
            .HasDatabaseName("ix_transactions_idempotency_key");

        builder.Property(t => t.Amount)
            .HasColumnName("amount")
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(t => t.Currency)
            .HasColumnName("currency")
            .HasMaxLength(3)
            .IsRequired();

        builder.Property(t => t.Type)
            .HasColumnName("type")
            .HasConversion<string>();

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        builder.Property(t => t.SenderWalletId).HasColumnName("sender_wallet_id");
        builder.Property(t => t.ReceiverWalletId).HasColumnName("receiver_wallet_id");
        builder.Property(t => t.FailureReason).HasColumnName("failure_reason").HasMaxLength(500);
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(200);
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.CompletedAt).HasColumnName("completed_at");

        builder.HasIndex(t => t.SenderWalletId)
            .HasDatabaseName("ix_transactions_sender_wallet_id");

        builder.HasIndex(t => t.ReceiverWalletId)
            .HasDatabaseName("ix_transactions_receiver_wallet_id");

        builder.HasIndex(t => t.CreatedAt)
            .HasDatabaseName("ix_transactions_created_at");
    }
}