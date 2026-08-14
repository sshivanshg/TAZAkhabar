/** Split article body into non-empty paragraphs on blank lines. */
export function splitArticleBody(body: string | null | undefined): string[] {
  if (!body) {
    return []
  }
  return body
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
