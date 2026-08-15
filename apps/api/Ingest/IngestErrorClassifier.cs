using System.Net;
using Microsoft.EntityFrameworkCore;

namespace NewsFeed.Api.Ingest;

public static class IngestErrorClassifier
{
    public const string FetchFailed = "Fetch failed";
    public const string FetchTimeout = "Fetch timeout";
    public const string ParseError = "Parse error";
    public const string InvalidSource = "Invalid source configuration";
    public const string InvalidSourceUrl = "Invalid source URL";
    public const string DatabaseWriteFailed = "Database write failed";
    public const string NoArticlesFound = "No articles found";
    public const string ProcessingFailed = "Processing failed";

    public static string FromException(Exception ex) =>
        ex switch
        {
            TaskCanceledException => FetchTimeout,
            TimeoutException => FetchTimeout,
            HttpRequestException http when http.StatusCode is HttpStatusCode status => $"HTTP {(int)status}",
            HttpRequestException => FetchFailed,
            System.Text.Json.JsonException => ParseError,
            System.Xml.XmlException => ParseError,
            DbUpdateException => DatabaseWriteFailed,
            InvalidOperationException => ProcessingFailed,
            _ => ProcessingFailed,
        };
}
