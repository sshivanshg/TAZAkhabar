namespace NewsFeed.Api.Data;

public enum ArticleStatus
{
    // Published is 0 so CLR default matches the DB default (Draft must insert as Draft).
    Published,
    Draft,
    PendingReview,
    Rejected,
    Archived,
}
