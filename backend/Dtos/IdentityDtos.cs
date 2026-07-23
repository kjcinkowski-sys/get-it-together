using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record CreateIdentityRequest(string Statement, CompanionType? Companion);

public record UpdateIdentityRequest(string Statement, CompanionType? Companion);

public record IdentityResponse(
    Guid Id,
    string Statement,
    CompanionType Companion,
    bool IsArchived,
    DateTime CreatedAt);
