using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityHabits.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceFrequencyWithScheduledDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FrequencyType",
                table: "Habits");

            migrationBuilder.DropColumn(
                name: "TargetPerWeek",
                table: "Habits");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FrequencyType",
                table: "Habits",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetPerWeek",
                table: "Habits",
                type: "integer",
                nullable: false,
                defaultValue: 7);
        }
    }
}
