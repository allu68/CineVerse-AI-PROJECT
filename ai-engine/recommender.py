"""
CineVerse AI - Recommendation Engine
Stable Production Version
"""

import os
import re
import time
import logging
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import joblib

# =====================================================
# ENV + LOGGING
# =====================================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE = "https://api.themoviedb.org/3"

MODELS_DIR = Path(__file__).parent.parent / "models"
DATASETS_DIR = Path(__file__).parent.parent / "datasets"

MODELS_DIR.mkdir(exist_ok=True)
DATASETS_DIR.mkdir(exist_ok=True)

# =====================================================
# SAFE SESSION WITH RETRIES
# =====================================================

session = requests.Session()

retry = Retry(
    total=5,
    connect=5,
    read=5,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
)

adapter = HTTPAdapter(max_retries=retry)

session.mount("http://", adapter)
session.mount("https://", adapter)

session.headers.update({
    "User-Agent": "CineVerse-AI/1.0"
})

# =====================================================
# TMDB SAFE REQUEST
# =====================================================

def tmdb_get(endpoint: str, params: dict = {}) -> dict:
    """Safe TMDB request handler."""

    if not TMDB_API_KEY:
        logger.warning("TMDB API key missing")
        return {}

    url = f"{TMDB_BASE}/{endpoint}"

    try:
        response = session.get(
            url,
            params={
                "api_key": TMDB_API_KEY,
                **params
            },
            timeout=20
        )

        response.raise_for_status()

        time.sleep(0.15)

        return response.json()

    except Exception as e:
        logger.warning(f"TMDB ERROR [{endpoint}] -> {e}")
        return {}

# =====================================================
# TEXT CLEANING
# =====================================================

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text

# =====================================================
# BUILD FEATURE SOUP
# =====================================================

def build_soup(row: pd.Series) -> str:

    parts = []

    overview = clean_text(str(row.get("overview", "")))
    genres = clean_text(str(row.get("genres", "")))
    keywords = clean_text(str(row.get("keywords", "")))
    cast = clean_text(str(row.get("cast", "")))
    director = clean_text(str(row.get("director", "")))
    language = clean_text(str(row.get("original_language", "")))

    parts.extend([overview] * 3)
    parts.extend([genres] * 2)
    parts.extend([keywords] * 2)

    parts.append(cast)
    parts.append(director)

    parts.extend([language] * 2)

    return " ".join(parts)

# =====================================================
# ENGINE
# =====================================================

class RecommendationEngine:

    def __init__(self):

        self.df = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self.id_to_idx = {}
        self.is_ready = False

    # =================================================

    def fetch_movies(self, pages=3):

        logger.info("Fetching TMDB movies...")

        movies = []

        languages = [
            "te",
            "hi",
            "ta",
            "ml",
            "kn",
            "en"
        ]

        for lang in languages:

            logger.info(f"Fetching language: {lang}")

            for page in range(1, pages + 1):

                data = tmdb_get(
                    "discover/movie",
                    {
                        "with_original_language": lang,
                        "sort_by": "popularity.desc",
                        "vote_count.gte": 50,
                        "page": page
                    }
                )

                results = data.get("results", [])

                if not results:
                    break

                movies.extend(results)

        logger.info(f"Fetched raw movies: {len(movies)}")

        return movies

    # =================================================

    def enrich_movie(self, movie):

        movie_id = movie.get("id")

        if not movie_id:
            return None

        details = tmdb_get(
            f"movie/{movie_id}",
            {
                "append_to_response": "credits,keywords"
            }
        )

        if not details:
            return None

        credits = details.get("credits", {})
        cast_data = credits.get("cast", [])
        crew_data = credits.get("crew", [])

        cast = [c["name"] for c in cast_data[:8]]

        director = ""

        for member in crew_data:
            if member.get("job") == "Director":
                director = member.get("name")
                break

        genres = [
            g["name"]
            for g in details.get("genres", [])
        ]

        keywords = [
            k["name"]
            for k in details.get(
                "keywords",
                {}
            ).get("keywords", [])
        ]

        return {
            "movie_id": movie_id,
            "movie_title": details.get("title", ""),
            "year": str(details.get("release_date", ""))[:4],
            "original_language": details.get("original_language", ""),
            "genres": ", ".join(genres),
            "overview": details.get("overview", ""),
            "keywords": ", ".join(keywords[:15]),
            "cast": ", ".join(cast),
            "director": director,
            "poster_path": details.get("poster_path", ""),
            "vote_average": details.get("vote_average", 0),
            "vote_count": details.get("vote_count", 0),
            "popularity": details.get("popularity", 0),
        }

    # =================================================

    def build_dataset(self):

        logger.info("Building dataset...")

        raw_movies = self.fetch_movies()

        seen = set()
        unique_movies = []

        for movie in raw_movies:

            mid = movie.get("id")

            if mid and mid not in seen:
                seen.add(mid)
                unique_movies.append(movie)

        logger.info(f"Unique movies: {len(unique_movies)}")

        enriched = []

        LIMIT = 500

        for idx, movie in enumerate(unique_movies[:LIMIT]):

            if idx % 25 == 0:
                logger.info(f"Processing {idx}/{LIMIT}")

            try:

                data = self.enrich_movie(movie)

                if data:
                    enriched.append(data)

            except Exception as e:
                logger.warning(e)

        df = pd.DataFrame(enriched)

        if df.empty:
            raise Exception("Dataset creation failed")

        df = df.drop_duplicates(subset=["movie_id"])

        df["soup"] = df.apply(build_soup, axis=1)

        dataset_path = DATASETS_DIR / "main_data.csv"

        df.to_csv(dataset_path, index=False)

        logger.info(f"Dataset saved -> {dataset_path}")

        return df

    # =================================================

    def train(self):

        logger.info("Training TF-IDF engine...")

        self.df = self.build_dataset()

        self.vectorizer = TfidfVectorizer(
            max_features=15000,
            ngram_range=(1, 2),
            stop_words="english"
        )

        self.tfidf_matrix = self.vectorizer.fit_transform(
            self.df["soup"]
        )

        self.id_to_idx = {
            int(mid): idx
            for idx, mid in enumerate(self.df["movie_id"])
        }

        joblib.dump(
            self.df,
            MODELS_DIR / "movies_df.pkl"
        )

        joblib.dump(
            self.vectorizer,
            MODELS_DIR / "vectorizer.pkl"
        )

        joblib.dump(
            self.tfidf_matrix,
            MODELS_DIR / "tfidf.pkl"
        )

        self.is_ready = True

        logger.info("TF-IDF training completed")

    # =================================================

    def recommend_by_title(
        self,
        title: str,
        limit: int = 10
    ):

        if not self.is_ready:
            return []

        title = title.lower()

        matches = self.df[
            self.df["movie_title"]
            .str.lower()
            .str.contains(title, na=False)
        ]

        if matches.empty:
            return []

        idx = matches.index[0]

        scores = cosine_similarity(
            self.tfidf_matrix[idx],
            self.tfidf_matrix
        ).flatten()

        similar_indices = (
            scores.argsort()[::-1][1:limit + 1]
        )

        recommendations = []

        for i in similar_indices:

            row = self.df.iloc[i]

            recommendations.append({
                "movie_id": int(row["movie_id"]),
                "title": row["movie_title"],
                "poster_path": row["poster_path"],
                "genres": row["genres"],
                "rating": row["vote_average"],
                "year": row["year"],
                "language": row["original_language"],
                "score": round(float(scores[i]), 4)
            })

        return recommendations

# =====================================================
# SINGLETON
# =====================================================

engine = RecommendationEngine()