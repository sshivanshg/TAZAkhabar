namespace NewsFeed.Api.Options;

public sealed class UploadOptions
{
    public const string SectionName = "Upload";

    public string RootPath { get; set; } = "";

    public long MaxBytes { get; set; } = 26_214_400;

    public int MaxPages { get; set; } = 40;
}
