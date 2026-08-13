namespace NewsFeed.Api.Options;

public sealed class ExtractionWorkerOptions
{
    public const string SectionName = "ExtractionWorker";

    /// <summary>Base URL of the Python extraction worker (e.g. http://127.0.0.1:8090).</summary>
    public string BaseUrl { get; set; } = "";

    /// <summary>How long to await a single source /run call.</summary>
    public int TimeoutSeconds { get; set; } = 600;
}
