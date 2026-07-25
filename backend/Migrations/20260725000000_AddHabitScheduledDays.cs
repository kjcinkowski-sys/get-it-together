using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityHabits.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHabitScheduledDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ScheduledDays",
                table: "Habits",
                type: "integer",
                nullable: false,
                defaultValue: 127);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDays",
                table: "Habits");
        }
    }
}
