using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Endpoints;

internal static class AdminValidation
{
    public static IResult? ValidateCreateArticle(CreateAdminArticleRequest? request)
    {
        if (request is null)
        {
            return Invalid("body", "Request body is required.");
        }

        var errors = new Dictionary<string, string[]>();
        Require(errors, nameof(request.Headline), request.Headline);
        Require(errors, nameof(request.Summary), request.Summary);
        Require(errors, nameof(request.City), request.City);
        Require(errors, nameof(request.Category), request.Category);
        Require(errors, nameof(request.SourceName), request.SourceName);
        Require(errors, nameof(request.SourceUrl), request.SourceUrl);
        if (request.PublishNow is null)
        {
            Add(errors, nameof(request.PublishNow), "publishNow is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Headline) && request.Headline.Trim().Length > 300)
        {
            Add(errors, nameof(request.Headline), "headline must be at most 300 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Summary) && request.Summary.Trim().Length > 1000)
        {
            Add(errors, nameof(request.Summary), "summary must be at most 1000 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.SourceName) && request.SourceName.Trim().Length > 120)
        {
            Add(errors, nameof(request.SourceName), "sourceName must be at most 120 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.SourceUrl) && request.SourceUrl.Trim().Length > ArticleSourceUrl.MaxLength)
        {
            Add(errors, nameof(request.SourceUrl), $"sourceUrl must be at most {ArticleSourceUrl.MaxLength} characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.DetectedLanguage)
            && ArticleLanguageDetector.Normalize(request.DetectedLanguage) is null)
        {
            Add(errors, nameof(request.DetectedLanguage), "detectedLanguage must be a short ISO language code.");
        }

        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }

    public static IResult? ValidateCreateSource(CreateAdminSourceRequest? request)
    {
        if (request is null)
        {
            return Invalid("body", "Request body is required.");
        }

        var errors = new Dictionary<string, string[]>();
        Require(errors, nameof(request.Name), request.Name);
        Require(errors, nameof(request.City), request.City);
        Require(errors, nameof(request.Type), request.Type);
        Require(errors, nameof(request.Kind), request.Kind);
        Require(errors, nameof(request.Language), request.Language);
        if (request.IsActive is null)
        {
            Add(errors, nameof(request.IsActive), "isActive is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length > 120)
        {
            Add(errors, nameof(request.Name), "name must be at most 120 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Language) && request.Language.Trim().Length > 8)
        {
            Add(errors, nameof(request.Language), "language must be at most 8 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.FeedUrl) && request.FeedUrl.Trim().Length > 500)
        {
            Add(errors, nameof(request.FeedUrl), "feedUrl must be at most 500 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Type)
            && Enum.TryParse<NewsFeed.Api.Data.SourceType>(request.Type, ignoreCase: true, out var type)
            && type is NewsFeed.Api.Data.SourceType.Rss or NewsFeed.Api.Data.SourceType.Scrape
            && string.IsNullOrWhiteSpace(request.FeedUrl))
        {
            Add(errors, nameof(request.FeedUrl), "feedUrl is required for RSS and Scrape sources.");
        }

        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }

    private static IResult Invalid(string field, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    private static void Require(Dictionary<string, string[]> errors, string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Add(errors, field, $"{LowerCamel(field)} is required.");
        }
    }

    private static void Add(Dictionary<string, string[]> errors, string field, string message)
    {
        if (errors.TryGetValue(field, out var existing))
        {
            errors[field] = [.. existing, message];
        }
        else
        {
            errors[field] = [message];
        }
    }

    private static string LowerCamel(string value) =>
        string.IsNullOrEmpty(value) ? value : char.ToLowerInvariant(value[0]) + value[1..];
}
