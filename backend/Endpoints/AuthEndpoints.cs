using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest request, AppDbContext db, JwtTokenService tokens) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.DisplayName))
            {
                return Results.BadRequest(new { message = "Email, password, and display name are required." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var exists = await db.Users.AnyAsync(u => u.Email == normalizedEmail);
            if (exists)
            {
                return Results.Conflict(new { message = "An account with this email already exists." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                PasswordHash = PasswordHasher.Hash(request.Password),
                DisplayName = request.DisplayName.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            db.Users.Add(user);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { message = "An account with this email already exists." });
            }

            var token = tokens.GenerateToken(user);
            return Results.Ok(new AuthResponse(token, new UserResponse(user.Id, user.Email, user.DisplayName)));
        });

        group.MapPost("/login", async (LoginRequest request, AppDbContext db, JwtTokenService tokens) =>
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await db.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            var token = tokens.GenerateToken(user);
            return Results.Ok(new AuthResponse(token, new UserResponse(user.Id, user.Email, user.DisplayName)));
        });

        group.MapGet("/me", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(claims.GetUserId());
            return user is null
                ? Results.NotFound()
                : Results.Ok(new UserResponse(user.Id, user.Email, user.DisplayName));
        }).RequireAuthorization();
    }
}
