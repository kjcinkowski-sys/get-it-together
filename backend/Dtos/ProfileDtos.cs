using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

/// <summary>Full profile view — includes account metadata the auth responses omit.</summary>
public record ProfileResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    string? TimeZone,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

/// <summary>
/// Updates the editable profile fields. Every field is replaced with what's sent,
/// so the client should submit the current values for anything it isn't changing.
/// AvatarUrl uses null to keep the existing picture and empty string to clear it.
/// </summary>
public record UpdateProfileRequest(
    string DisplayName,
    string Email,
    string? TimeZone,
    string? AvatarUrl);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public static class UserMapping
{
    public static UserResponse ToUserResponse(this User user) =>
        new(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.TimeZone);

    public static ProfileResponse ToProfileResponse(this User user) =>
        new(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.TimeZone, user.CreatedAt, user.UpdatedAt);
}
