using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace NewsFeed.Api.Endpoints;

public static class CitiesEndpoints
{
    public static RouteGroupBuilder MapCitiesEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/cities", async (AppDbContext db, CancellationToken cancellationToken) =>
            {
                var cities = await db.Cities
                    .AsNoTracking()
                    .OrderBy(c => c.Name)
                    .Select(c => new CityResponse(c.Id, c.Name, c.State, c.Slug))
                    .ToListAsync(cancellationToken);

                return Results.Ok(cities);
            })
            .WithName("GetCities")
            .WithOpenApi()
            .Produces<List<CityResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }
}
