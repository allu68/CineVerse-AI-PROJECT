"""
CineVerse AI - Sentiment Analysis Engine
Uses NLTK VADER + custom rule-based boosting for movie review sentiment.
"""

import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    import nltk
    try:
        nltk.data.find("sentiment/vader_lexicon.zip")
    except LookupError:
        nltk.download("vader_lexicon", quiet=True)
    _vader = SentimentIntensityAnalyzer()
    VADER_AVAILABLE = True
except Exception as e:
    logger.warning(f"VADER unavailable: {e}")
    VADER_AVAILABLE = False
    _vader = None

MOVIE_POSITIVE = {
    "masterpiece", "brilliant", "outstanding", "phenomenal", "incredible",
    "stunning", "spectacular", "magnificent", "breathtaking", "exceptional",
    "flawless", "superb", "gripping", "captivating", "riveting", "emotional",
    "powerful", "moving", "touching", "beautiful", "perfect", "fantastic",
    "amazing", "excellent", "great", "wonderful", "awesome", "best",
    "classic", "gem", "must-watch", "unforgettable",
}

MOVIE_NEGATIVE = {
    "terrible", "horrible", "awful", "dreadful", "atrocious", "pathetic",
    "boring", "tedious", "predictable", "disappointing", "waste", "trash",
    "bad", "worst", "mediocre", "garbage", "rubbish", "poor", "weak",
    "bland", "overrated", "confusing", "mess", "disaster",
    "incoherent", "pointless", "stupid", "ridiculous", "annoying",
}


def clean_review(text: str) -> str:
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[^\w\s'!?.,]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _lexicon_score(text: str) -> float:
    words = set(text.lower().split())
    pos = len(words & MOVIE_POSITIVE)
    neg = len(words & MOVIE_NEGATIVE)
    total = pos + neg
    return (pos - neg) / total if total > 0 else 0.0


def analyze_review(text: str) -> Dict[str, Any]:
    cleaned = clean_review(text)
    words = cleaned.lower().split()

    if VADER_AVAILABLE and _vader:
        scores = _vader.polarity_scores(cleaned)
        compound = scores["compound"]
        lexicon = _lexicon_score(cleaned)
        blended = compound * 0.75 + lexicon * 0.25
    else:
        blended = _lexicon_score(cleaned)
        scores = {"pos": 0, "neg": 0, "neu": 0, "compound": blended}

    if blended >= 0.05:
        sentiment = "positive"
        confidence = min(0.99, 0.5 + blended * 0.5)
    elif blended <= -0.05:
        sentiment = "negative"
        confidence = min(0.99, 0.5 + abs(blended) * 0.5)
    else:
        sentiment = "neutral"
        confidence = 0.5 + abs(blended) * 0.3

    abs_score = abs(blended)
    intensity = "strong" if abs_score >= 0.6 else "moderate" if abs_score >= 0.3 else "mild"

    return {
        "sentiment": sentiment,
        "confidence": round(confidence, 3),
        "intensity": intensity,
        "compound_score": round(blended, 4),
        "positive_score": round(float(scores.get("pos", 0)), 3),
        "negative_score": round(float(scores.get("neg", 0)), 3),
        "neutral_score": round(float(scores.get("neu", 0)), 3),
        "word_count": len(words),
    }


def analyze_reviews_batch(reviews: List[Dict]) -> Dict[str, Any]:
    if not reviews:
        return {
            "overall": "neutral", "positive_count": 0, "negative_count": 0,
            "neutral_count": 0, "total": 0, "positive_pct": 0,
            "negative_pct": 0, "avg_confidence": 0, "analyzed_reviews": [],
        }

    analyzed = []
    for rev in reviews:
        content = rev.get("content", "")
        if not content:
            continue
        result = analyze_review(content)
        analyzed.append({
            "id": rev.get("id", ""),
            "author": rev.get("author", "Anonymous"),
            "content": content[:500] + ("..." if len(content) > 500 else ""),
            "url": rev.get("url", ""),
            "created_at": rev.get("created_at", ""),
            **result,
        })

    if not analyzed:
        return {"overall": "neutral", "total": 0, "analyzed_reviews": []}

    pos = sum(1 for r in analyzed if r["sentiment"] == "positive")
    neg = sum(1 for r in analyzed if r["sentiment"] == "negative")
    neu = sum(1 for r in analyzed if r["sentiment"] == "neutral")
    total = len(analyzed)
    avg_conf = sum(r["confidence"] for r in analyzed) / total
    avg_compound = sum(r["compound_score"] for r in analyzed) / total

    if pos > neg and pos > neu:
        overall = "positive"
    elif neg > pos and neg > neu:
        overall = "negative"
    else:
        overall = "mixed"

    return {
        "overall": overall,
        "positive_count": pos, "negative_count": neg, "neutral_count": neu,
        "total": total,
        "positive_pct": round(pos / total * 100, 1),
        "negative_pct": round(neg / total * 100, 1),
        "neutral_pct": round(neu / total * 100, 1),
        "avg_confidence": round(avg_conf, 3),
        "avg_compound_score": round(avg_compound, 4),
        "analyzed_reviews": analyzed,
    }
