using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record CreateIdentityRequest(string Statement, CompanionType? Companion, string? CompanionName);

public record UpdateIdentityRequest(string Statement, CompanionType? Companion, string? CompanionName);

public record IdentityResponse(
    Guid Id,
    string Statement,
    CompanionType Companion,
    string? CompanionName,
    bool IsArchived,
    DateTime CreatedAt);
