from ingestion_engine.utils.deduplicator import UrlDeduplicator
from ingestion_engine.utils.media_cleaner import is_junk_image_url, pick_hero_image, to_absolute_url


def test_to_absolute_url():
    assert to_absolute_url("https://www.amarujala.com/a", "/images/pic.jpg") == "https://www.amarujala.com/images/pic.jpg"
    assert to_absolute_url("https://www.amarujala.com/a", "data:image/png;base64,xx") is None


def test_junk_image_filter():
    assert is_junk_image_url("https://cdn.example.com/logo-header.png")
    assert is_junk_image_url("https://cdn.example.com/photo.jpg", width=50, height=50)
    assert not is_junk_image_url("https://cdn.example.com/story-hero.jpg", width=800, height=450)


def test_pick_hero_skips_junk():
    hero = pick_hero_image(
        "https://www.amarujala.com/story",
        "/logo.png",
        "https://images.amarujala.com/hero.jpg",
    )
    assert hero == "https://images.amarujala.com/hero.jpg"


def test_dedupe_marks_and_expires(tmp_path):
    cache = tmp_path / "cache.json"
    dedupe = UrlDeduplicator(cache, ttl_seconds=3600)
    url = "https://www.amarujala.com/story-1"
    assert not dedupe.seen_recently(url)
    dedupe.mark(url)
    assert dedupe.seen_recently(url)
    # Expired entry
    key = UrlDeduplicator.hash_url(url)
    dedupe._entries[key] = 0
    dedupe._save()
    refreshed = UrlDeduplicator(cache, ttl_seconds=3600)
    assert not refreshed.seen_recently(url)
