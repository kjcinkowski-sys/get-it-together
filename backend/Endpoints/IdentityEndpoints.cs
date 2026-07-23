using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class IdentityEndpoints
{
    public static void MapIdentityEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/identities").WithTags("Identities").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var identities = await db.Identities
                .Where(i => i.UserId == userId && !i.IsArchived)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new IdentityResponse(i.Id, i.Statement, i.Companion, i.IsArchived, i.CreatedAt))
                .ToListAsync();

            return Results.Ok(identities);
        });

        group.MapPost("/", async (CreateIdentityRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
            {
                return Results.BadRequest(new { message = "Statement is required." });
            }

            var identity = new Identity
            {
                Id = Guid.NewGuid(),
                UserId = claims.GetUserId(),
                Statement = request.Statement.Trim(),
                Companion = request.Companion ?? CompanionType.Sprite,
                CreatedAt = DateTime.UtcNow,
            };

            db.Identities.Add(identity);
            await db.SaveChangesAsync();

            return Results.Created($"/api/identities/{identity.Id}",
                new IdentityResponse(identity.Id, identity.Statement, identity.Companion, identity.IsArchived, identity.CreatedAt));
        });

        group.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var identity = await FindOwnedIdentity(db, id, claims.GetUserId());
            return identity is null
                ? Results.NotFound()
                : Results.Ok(new IdentityResponse(identity.Id, identity.Statement, identity.Companion, identity.IsArchived, identity.CreatedAt));
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateIdentityRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
            {
                return Results.BadRequest(new { message = "Statement is required." });
            }

            var identity = await FindOwnedIdentity(db, id, claims.GetUserId());
            if (identity is null) return Results.NotFound();

            identity.Statement = request.Statement.Trim();
            if (request.Companion is not null)
            {
                identity.Companion = request.Companion.Value;
            }
            await db.SaveChangesAsync();

            return Results.Ok(new IdentityResponse(identity.Id, identity.Statement, identity.Companion, identity.IsArchived, identity.CreatedAt));
        });

        group.MapPatch("/{id:guid}/archive", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var identity = await FindOwnedIdentity(db, id, claims.GetUserId());
            if (identity is null) return Results.NotFound();

            identity.IsArchived = true;
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    private static Task<Identity?> FindOwnedIdentity(AppDbContext db, Guid id, Guid userId) =>
        db.Identities.SingleOrDefaultAsync(i => i.Id == id && i.UserId == userId);
}
