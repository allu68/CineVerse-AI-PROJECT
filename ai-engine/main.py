"""
CineVerse AI - FastAPI Main Application
"""

import os
import logging
import threading
from contextlib import asynccontextmanager
from typing import List, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from recommender import engine
from sentiment import analyze_review, analyze_reviews_batch


# ──────────────────────────────────────────────────────────────────────────────
# ENV + LOGGING
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE = os.getenv(
    "TMDB_BASE_URL",
    "https://api.themoviedb.org/3"
)


# ──────────────────────────────────────────────────────────────────────────────
# BACKGROUND TRAINING
# ──────────────────────────────────────────────────────────────────────────────

def train_engine_background():
    """
    Train recommendation engine safely in background.
    Prevents Render startup timeout.
    """

    try:
        logger.info("🧠 Training recommendation engine...")
        engine.train()
        logger.info("✅ Recommendation engine ready")

    except Exception as e:
        logger.exception(f"❌ Engine training failed: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# FASTAPI LIFESPAN
# ──────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("🚀 Starting CineVerse AI Engine...")

    # Start training in background thread
    threading.Thread(
        target=train_engine_background,
        daemon=True
    ).start()

    logger.info("✅ Background training thread started")

    yield

    logger.info("🛑 Shutting down CineVerse AI Engine...")


# ──────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CineVerse AI Engine",
    description="AI-powered movie recommendation and sentiment analysis API",
    version="1.0.0",
    lifespan=lifespan,
)


# ──────────────────────────────────────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ──────────────────────────────────────────────────────────────────────────────

class RecommendByTitleRequest(BaseModel):
    title: str
    limit: int = 12


class SentimentRequest(BaseModel):
    text: str


class BatchSentimentRequest(BaseModel):
    reviews: List[Dict[str, Any]]


# ──────────────────────────────────────────────────────────────────────────────
# ROOT ROUTES
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():

    return {
        "service": "CineVerse AI Engine",
        "version": "1.0.0",
        "status": "running",
        "engine_ready": getattr(engine, "is_ready", False),
        "corpus_size": (
            len(engine.df)
            if getattr(engine, "df", None) is not None
            else 0
        ),
    }


@app.get("/health")
def health():

    return {
        "status": "ok",
        "engine_ready": getattr(engine, "is_ready", False),
        "corpus_size": (
            len(engine.df)
            if getattr(engine, "df", None) is not None
            else 0
        ),
    }


# ──────────────────────────────────────────────────────────────────────────────
# RECOMMENDATION ROUTES
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/recommend/{movie_id}")
def recommend_by_id(movie_id: int, limit: int = 12):

    if not getattr(engine, "is_ready", False):
        raise HTTPException(
            status_code=503,
            detail="Recommendation engine not ready yet"
        )

    try:
        results = engine.recommend_by_id(
            movie_id,
            limit=limit
        )

        return {
            "movie_id": movie_id,
            "recommendations": results,
            "count": len(results),
        }

    except Exception as e:
        logger.exception(f"Recommendation error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Recommendation failed"
        )


@app.post("/recommend/by-title")
def recommend_by_title(req: RecommendByTitleRequest):

    if not getattr(engine, "is_ready", False):
        raise HTTPException(
            status_code=503,
            detail="Recommendation engine not ready yet"
        )

    try:
        results = engine.recommend_by_title(
            req.title,
            limit=req.limit
        )

        return {
            "query": req.title,
            "recommendations": results,
            "count": len(results),
        }

    except Exception as e:
        logger.exception(f"Title recommendation error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Recommendation failed"
        )


# ──────────────────────────────────────────────────────────────────────────────
# SENTIMENT ROUTES
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/sentiment/analyze")
def analyze_single(req: SentimentRequest):

    if not req.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    try:
        return analyze_review(req.text)

    except Exception as e:
        logger.exception(f"Sentiment analysis error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Sentiment analysis failed"
        )


@app.post("/sentiment/batch")
def analyze_batch(req: BatchSentimentRequest):

    try:
        return analyze_reviews_batch(req.reviews)

    except Exception as e:
        logger.exception(f"Batch sentiment error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Batch sentiment analysis failed"
        )


# ──────────────────────────────────────────────────────────────────────────────
# TMDB SENTIMENT ROUTE
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/sentiment/movie/{movie_id}")
async def sentiment_for_movie(movie_id: int):

    if not TMDB_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="TMDB API key not configured"
        )

    try:
        async with httpx.AsyncClient() as client:

            response = await client.get(
                f"{TMDB_BASE}/movie/{movie_id}/reviews",
                params={
                    "api_key": TMDB_API_KEY,
                    "page": 1
                },
                timeout=15,
            )

            response.raise_for_status()

            reviews = response.json().get("results", [])

    except Exception as e:
        logger.exception(f"TMDB fetch error: {e}")

        raise HTTPException(
            status_code=503,
            detail=f"Could not fetch reviews: {str(e)}"
        )

    try:
        result = analyze_reviews_batch(reviews)
        result["movie_id"] = movie_id

        return result

    except Exception as e:
        logger.exception(f"Movie sentiment processing error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Movie sentiment processing failed"
        )


# ──────────────────────────────────────────────────────────────────────────────
# MOVIE INFO
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/movie/{movie_id}/info")
def movie_info(movie_id: int):

    try:
        info = engine.get_movie_info(movie_id)

        if not info:
            raise HTTPException(
                status_code=404,
                detail="Movie not found in local corpus"
            )

        return info

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(f"Movie info error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Movie info fetch failed"
        )


# ──────────────────────────────────────────────────────────────────────────────
# ENGINE CONTROL
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/engine/retrain")
def retrain(background_tasks: BackgroundTasks):

    try:
        background_tasks.add_task(
            train_engine_background
        )

        return {
            "message": "Retraining started in background"
        }

    except Exception as e:
        logger.exception(f"Retrain error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Retraining failed"
        )


@app.get("/engine/stats")
def engine_stats():

    if (
        not getattr(engine, "is_ready", False)
        or getattr(engine, "df", None) is None
    ):
        return {
            "ready": False
        }

    try:
        lang_dist = (
            engine.df["original_language"]
            .value_counts()
            .head(10)
            .to_dict()
        )

        return {
            "ready": True,
            "total_movies": len(engine.df),
            "language_distribution": lang_dist,
            "features": (
                int(engine.tfidf_matrix.shape[1])
                if getattr(engine, "tfidf_matrix", None) is not None
                else 0
            ),
        }

    except Exception as e:
        logger.exception(f"Stats error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Engine stats failed"
        )