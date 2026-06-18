using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoRepair.Infrastructure.Migrations
{
    public partial class AddStockAlertIdToReviewOpinion : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StockAlertId",
                table: "ReviewOpinions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewOpinions_StockAlertId",
                table: "ReviewOpinions",
                column: "StockAlertId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewOpinions_StockAlerts_StockAlertId",
                table: "ReviewOpinions",
                column: "StockAlertId",
                principalTable: "StockAlerts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReviewOpinions_StockAlerts_StockAlertId",
                table: "ReviewOpinions");

            migrationBuilder.DropIndex(
                name: "IX_ReviewOpinions_StockAlertId",
                table: "ReviewOpinions");

            migrationBuilder.DropColumn(
                name: "StockAlertId",
                table: "ReviewOpinions");
        }
    }
}
