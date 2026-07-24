using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class ProfileEndpoints
{
    // Avatars are stored inline as data URLs (no object storage), so cap the payload
    // to keep rows small. ~1.4 MB of image once base64 is decoded — plenty for a photo.
    private const int MaxAvatarLength = 2_000_000;

    public static void MapProfileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/profile").WithTags("Profile").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(claims.GetUserId());
            return user is null ? Results.NotFound() : Results.Ok(user.ToProfileResponse());
        });

        group.MapPut("/", async (UpdateProfileRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(claims.GetUserId());
            if (user is null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(request.DisplayName))
            {
                return Results.BadRequest(new { message = "Display name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
            {
                return Results.BadRequest(new { message = "Please provide a valid email address." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (normalizedEmail != user.Email)
            {
                var taken = await db.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != user.Id);
                if (taken)
                {
                    return Results.Conflict(new { message = "An account with this email already exists." });
                }
            }

            if (!TryNormalizeTimeZone(request.TimeZone, out var timeZone))
            {
                return Results.BadRequest(new { message = "That time zone isn't recognized." });
            }

            if (!TryNormalizeAvatar(request.AvatarUrl, user.AvatarUrl, out var avatarUrl, out var avatarError))
            {
                return Results.BadRequest(new { message = avatarError });
            }

            user.DisplayName = request.DisplayName.Trim();
            user.Email = normalizedEmail;
            user.TimeZone = timeZone;
            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { message = "An account with this email already exists." });
            }

            return Results.Ok(user.ToProfileResponse());
        });

        group.MapPut("/password", async (ChangePasswordRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(claims.GetUserId());
            if (user is null) return Results.NotFound();

            if (string.IsNullOrEmpty(request.CurrentPassword) ||
                !PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return Results.BadRequest(new { message = "Your current password is incorrect." });
            }

            if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 8)
            {
                return Results.BadRequest(new { message = "New password must be at least 8 characters." });
            }

            user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    /// <summary>
    /// Blank input clears the stored zone; otherwise the id must be a real IANA/system
    /// zone so downstream "what day is it for this user" math can trust it.
    /// </summary>
    private static bool TryNormalizeTimeZone(string? input, out string? normalized)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            normalized = null;
            return true;
        }

        var trimmed = input.Trim();
        if (TimeZoneInfo.TryFindSystemTimeZoneById(trimmed, out _))
        {
            normalized = trimmed;
            return true;
        }

        normalized = null;
        return false;
    }

    /// <summary>
    /// null keeps the current avatar, empty string clears it, and any other value must be
    /// an image data URL within the size cap. Returns false with a message on rejection.
    /// </summary>
    private static bool TryNormalizeAvatar(string? input, string? current, out string? normalized, out string? error)
    {
        error = null;

        if (input is null)
        {
            normalized = current;
            return true;
        }

        if (input.Length == 0)
        {
            normalized = null;
            return true;
        }

        if (!input.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = null;
            error = "Profile picture must be an image.";
            return false;
        }

        if (input.Length > MaxAvatarLength)
        {
            normalized = null;
            error = "That image is too large. Please choose one under 1.5 MB.";
            return false;
        }

        normalized = input;
        return true;
    }
}
