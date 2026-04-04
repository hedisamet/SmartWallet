using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartWallet.Domain.Entities;

namespace SmartWallet.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("wallets");
        builder.HasKey(w => w.Id);

        builder.Property(w => w.Id)
            .HasColumnName("id");

        builder.Property(w => w.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        // Map private backing field directly — keeps domain setter private
        builder.Property<decimal>("_balance")
            .HasColumnName("balance")
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property<bool>("_isLocked")
            .HasColumnName("is_locked")
            .HasDefaultValue(false);

        builder.OwnsOne(w => w.Currency, curr =>
        {
            curr.Property(c => c.Code)
                .HasColumnName("currency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.Property(w => w.CreatedAt).HasColumnName("created_at");
        builder.Property(w => w.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(w => w.UserId)
            .IsUnique()
            .HasDatabaseName("ix_wallets_user_id");

        // Optimistic concurrency — second line of defense after FOR UPDATE
        builder.Property<byte[]>("RowVersion")
            .IsRowVersion()
            .HasColumnName("row_version");
    }
}