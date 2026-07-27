using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityHabits.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHabitType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 0 = Build (a habit to build). Existing rows are all build habits.
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Habits",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Habits");
        }
    }
}
