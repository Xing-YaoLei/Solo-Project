using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoRepair.Infrastructure.Migrations
{
    public partial class AddStockAlertIdToReviewOpinion : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 幂等：如果 QuoteId 列当前为 NOT NULL，则改为 NULL 以匹配新契约
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'ReviewOpinions'
      AND COLUMN_NAME = 'QuoteId'
      AND IS_NULLABLE = 'NO'
)
BEGIN
    ALTER TABLE ReviewOpinions ALTER COLUMN QuoteId uniqueidentifier NULL;
END
");

            // 幂等：仅在 StockAlertId 列不存在时添加列、索引与外键
            migrationBuilder.Sql(@"
IF COL_LENGTH('ReviewOpinions', 'StockAlertId') IS NULL
BEGIN
    ALTER TABLE ReviewOpinions ADD StockAlertId uniqueidentifier NULL;

    CREATE INDEX [IX_ReviewOpinions_StockAlertId]
        ON ReviewOpinions ([StockAlertId]);

    ALTER TABLE ReviewOpinions ADD CONSTRAINT [FK_ReviewOpinions_StockAlerts_StockAlertId]
        FOREIGN KEY ([StockAlertId]) REFERENCES [StockAlerts] ([Id]) ON DELETE CASCADE;
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 幂等：仅在外键/索引/列存在时回滚
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_ReviewOpinions_StockAlerts_StockAlertId'
      AND parent_object_id = OBJECT_ID('ReviewOpinions')
)
BEGIN
    ALTER TABLE ReviewOpinions DROP CONSTRAINT [FK_ReviewOpinions_StockAlerts_StockAlertId];
END

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ReviewOpinions_StockAlertId'
      AND object_id = OBJECT_ID('ReviewOpinions')
)
BEGIN
    DROP INDEX [IX_ReviewOpinions_StockAlertId] ON ReviewOpinions;
END

IF COL_LENGTH('ReviewOpinions', 'StockAlertId') IS NOT NULL
BEGIN
    ALTER TABLE ReviewOpinions DROP COLUMN StockAlertId;
END

-- 将 QuoteId 恢复为 NOT NULL（仅当列存在且当前为可空时）
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'ReviewOpinions'
      AND COLUMN_NAME = 'QuoteId'
      AND IS_NULLABLE = 'YES'
)
BEGIN
    -- 先移除 NULL 值后再设为 NOT NULL（避免迁移失败）
    UPDATE ReviewOpinions SET QuoteId = '00000000-0000-0000-0000-000000000000' WHERE QuoteId IS NULL;
    ALTER TABLE ReviewOpinions ALTER COLUMN QuoteId uniqueidentifier NOT NULL;
END
");
        }
    }
}
