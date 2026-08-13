using System.Text;
using UglyToad.PdfPig;

namespace NewsFeed.Api.Ingest;

public sealed record PdfExtractResult(int PageCount, string Text);

public static class PdfTextExtractor
{
    public static PdfExtractResult Extract(Stream pdf)
    {
        using var document = PdfDocument.Open(pdf);
        var text = new StringBuilder();
        foreach (var page in document.GetPages())
        {
            if (text.Length > 0)
            {
                text.Append('\n');
            }

            text.Append(page.Text);
        }

        return new PdfExtractResult(document.NumberOfPages, text.ToString());
    }
}
