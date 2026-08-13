using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Endpoints;

public static class AdminAuthEndpoints
{
    public const int DisplayNameMaxLength = 80;
    public static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    public static RouteGroupBuilder MapAdminAuthEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapPost("/login", (
                AdminLoginRequest request,
                IOptions<AdminOptions> options) =>
            {
                var displayName = request.DisplayName?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    return Results.Problem(
                        title: "Invalid displayName",
                        detail: "displayName is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                if (displayName.Length > DisplayNameMaxLength)
                {
                    return Results.Problem(
                        title: "Invalid displayName",
                        detail: $"displayName must be at most {DisplayNameMaxLength} characters.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var configured = options.Value;
                if (!SecretMatches(request.Password ?? "", configured.Password)
                    || string.IsNullOrEmpty(configured.JwtSigningKey))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid admin credentials.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var expiresAt = DateTimeOffset.UtcNow.Add(TokenLifetime);
                var token = CreateToken(displayName, configured.JwtSigningKey, expiresAt);
                return Results.Ok(new AdminLoginResponse(token, expiresAt));
            })
            .WithName("AdminLogin")
            .AllowAnonymous()
            .RequireRateLimiting("admin-login")
            .WithOpenApi()
            .Produces<AdminLoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return admin;
    }

    public static bool SecretMatches(string provided, string configured)
    {
        if (string.IsNullOrEmpty(configured) || string.IsNullOrEmpty(provided))
        {
            return false;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var configuredBytes = Encoding.UTF8.GetBytes(configured);
        return providedBytes.Length == configuredBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, configuredBytes);
    }

    private static string CreateToken(string displayName, string signingKey, DateTimeOffset expiresAt)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "admin"),
            new Claim(ClaimTypes.Name, displayName),
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
