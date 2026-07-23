using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityHabits.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityCompanion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Companion",
                table: "Identities",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Companion",
                table: "Identities");
        }
    }
}
