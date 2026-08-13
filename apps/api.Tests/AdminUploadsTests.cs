using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class AdminUploadsTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public AdminUploadsTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UploadPdf_ReturnsQueuedAndCreatesPendingReview()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory, "Editor One");
        using var content = PdfMultipart("hello.pdf", cityHintId: 2);

        var response = await client.PostAsync("/api/admin/uploads", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<DocumentUploadResponseDto>(TestJson.Options);
        Assert.NotNull(created);
        Assert.Equal("hello.pdf", created.OriginalFileName);
        Assert.Equal("application/pdf", created.ContentType);
        Assert.Equal(2, created.CityHintId);
        Assert.Contains(created.Status, ["Queued", "Processing", "Ready"]);

        var ready = await WaitUntilProcessedAsync(client, created.Id);
        if (ready.Status is not "Ready" and not "Failed")
        {
            using var scope = _factory.Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<PdfIngestService>()
                .ProcessUploadAsync(created.Id, CancellationToken.None);
            ready = await client.GetFromJsonAsync<DocumentUploadResponseDto>(
                $"/api/admin/uploads/{created.Id}", TestJson.Options);
        }

        Assert.Equal("Ready", ready!.Status);
        Assert.True(ready.ArticlesCreated >= 1);
        Assert.NotNull(ready.IngestionRunId);

        var listed = await client.GetFromJsonAsync<PagedDocumentUploadsResponse>(
            "/api/admin/uploads?page=1", TestJson.Options);
        Assert.Contains(listed!.Items, u => u.Id == created.Id);

        var pending = await client.GetFromJsonAsync<PagedAdminArticlesResponse>(
            "/api/admin/articles?status=PendingReview", TestJson.Options);
        Assert.Contains(pending!.Items, a => a.Headline == "From PDF");
    }

    [Fact]
    public async Task Upload_DisallowedContentType_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        using var content = new MultipartFormDataContent();
        var file = new ByteArrayContent("%PDF-1.4"u8.ToArray());
        file.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        content.Add(file, "file", "notes.txt");

        var response = await client.PostAsync("/api/admin/uploads", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestJson.Options);
        Assert.NotNull(problem);
    }

    [Fact]
    public async Task Upload_OversizeFile_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        long maxBytes;
        using (var scope = _factory.Services.CreateScope())
        {
            maxBytes = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<UploadOptions>>()
                .Value.MaxBytes;
        }

        using var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(new byte[maxBytes + 1]);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(file, "file", "big.pdf");

        var response = await client.PostAsync("/api/admin/uploads", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Uploads_WithoutBearer_Returns401()
    {
        var client = _factory.CreateSeededClient();
        using var content = PdfMultipart("hello.pdf", cityHintId: null);
        var response = await client.PostAsync("/api/admin/uploads", content);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<DocumentUploadResponseDto> WaitUntilProcessedAsync(HttpClient client, int id)
    {
        DocumentUploadResponseDto? current = null;
        for (var i = 0; i < 50; i++)
        {
            current = await client.GetFromJsonAsync<DocumentUploadResponseDto>(
                $"/api/admin/uploads/{id}", TestJson.Options);
            if (current is { Status: "Ready" or "Failed" })
            {
                return current;
            }

            await Task.Delay(100);
        }

        return current!;
    }

    private static MultipartFormDataContent PdfMultipart(string fileName, int? cityHintId)
    {
        var bytes = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName));
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(file, "file", fileName);
        if (cityHintId is int hint)
        {
            content.Add(new StringContent(hint.ToString()), "cityHintId");
        }

        return content;
    }
}
