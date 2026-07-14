using IdentityHabits.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// TODO: replace with the authenticated user's id once auth is added.
var testUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

app.MapGet("/api/identities", async (AppDbContext db) =>
{
    var identities = await db.Identities
        .Where(i => i.UserId == testUserId)
        .ToListAsync();
    return Results.Ok(identities);
})
.WithName("GetIdentities")
.WithOpenApi();

app.Run();
