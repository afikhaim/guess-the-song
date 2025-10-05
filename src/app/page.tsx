"use client";

import { useState, useCallback, useEffect } from "react";
import "./globals.css";

export interface Song {
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string;
  releaseDate: string;
  releaseYear: number;
}

const extractYear = (dateStr: string): number => {
  const date = new Date(dateStr);
  return date.getFullYear() || new Date().getFullYear();
};

export default function Home() {
  const [song, setSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGuessed, setIsGuessed] = useState(false);
  const [userGuess, setUserGuess] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const getRandomSong = useCallback(async () => {
    setLoading(true);
    setIsGuessed(false);
    setUserGuess(null);
    setSong(null);
    setLastScore(null);

    let tracksToChoose = songs;

    try {
      if (songs.length === 0) {
        const res = await fetch(`/api/itunes?term=greatest hits`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const songsWithYear: Song[] = data.songs.map(
          (s: Omit<Song, "releaseYear">) => ({
            ...s,
            releaseYear: extractYear(s.releaseDate),
          })
        );

        setSongs(songsWithYear);
        tracksToChoose = songsWithYear;
      }

      const randomIndex = Math.floor(Math.random() * tracksToChoose.length);
      const chosen = tracksToChoose[randomIndex];

      if (chosen) setSong(chosen);
    } catch (err) {
      console.error("Error fetching song:", err);
    } finally {
      setLoading(false);
    }
  }, [songs]);

  useEffect(() => {
    if (songs.length === 0) {
      getRandomSong();
    }
  }, [getRandomSong, songs.length]);

  const calculateScore = () => {
    if (!song || userGuess === null || isGuessed || String(userGuess).length !== 4) return;

    const MAX_SCORE = 100;
    const PENALTY_PER_YEAR = 10;
    const MAX_DIFF = 10;

    const correctYear = song.releaseYear;
    const diff = Math.abs(correctYear - userGuess);

    let score = 0;

    if (diff <= MAX_DIFF) {
      score = MAX_SCORE - PENALTY_PER_YEAR * diff;
    }

    setTotalScore((prev) => prev + score);
    setLastScore(score);
    setIsGuessed(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFeedbackMessage = () => {
    if (!song || lastScore === null) return null;

    if (lastScore === 100) {
      return `🎉 ניחוש מושלם! 100 נקודות.`;
    } else if (lastScore > 0) {
      const diff = Math.abs(song.releaseYear - (userGuess ?? 0));
      return `✅ קרוב! קיבלת ${lastScore} נקודות. פער של ${diff} שנים.`;
    } else {
      return `❌ טעות. השנה הנכונה היא ${song.releaseYear}.`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center">
        🎵 נחש את השנה!
      </h1>
      <p className="text-sm text-yellow-400 mb-6 font-semibold">
        ניקוד: {totalScore}
      </p>

      {/* כרטיס מתהפך */}
      <div className={`flip-card ${isGuessed ? "flipped" : ""}`}>
        <div className="flip-card-inner">
          {/* חזית (לפני ניחוש) */}
          <div className="flip-card-front bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-700 text-center">
            {song ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  מהי שנת היציאה של השיר?
                </h2>
                <div className="w-40 h-40 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500">
                  🎧 מאזין לשיר...
                </div>
                <audio
                  autoPlay
                  controls
                  src={song.preview}
                  className="mx-auto mt-4 w-full"
                >
                  הדפדפן שלך לא תומך בנגן אודיו
                </audio>
              </>
            ) : (
              <h2 className="text-2xl font-bold">
                לחץ על הגרל שיר כדי להתחיל 🎲
              </h2>
            )}
          </div>

          {/* גב (אחרי ניחוש) */}
          <div className="flip-card-back bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-700 text-center">
            {song && (
              <>
                <img
                  src={song.cover}
                  alt={song.title}
                  className="rounded-2xl mx-auto shadow-lg mb-4 w-40 h-40 object-cover border-4 border-green-500"
                />
                <h2 className="text-xl font-bold">{song.title}</h2>
                <p className="text-gray-400 mb-2">{song.album}</p>
                <p className="text-lg font-extrabold text-green-400 mt-2">
                  שנת יציאה: {song.releaseYear} 🗓️
                </p>
                <p className="text-sm text-gray-500">
                  ({formatDate(song.releaseDate)})
                </p>
                <p className="mt-4 text-yellow-300 font-bold text-lg">
                  {getFeedbackMessage()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* אזור ניחוש */}
      {song && !isGuessed && (
        <div className="guessing-area mt-4 mb-8 w-full max-w-sm p-4 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold mb-3 text-center">
            נחש את שנת היציאה!
          </h2>
          <div className="flex justify-center items-center gap-4">
            <input
              type="number"
              placeholder="שנה (YYYY)"
              value={userGuess || ""}
              onChange={(e) => setUserGuess(parseInt(e.target.value) || null)}
              min="1950"
              max={new Date().getFullYear()}
              className="p-3 border border-gray-600 rounded-lg text-center w-28 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={calculateScore}
              disabled={!userGuess || String(userGuess).length !== 4}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50"
            >
              נחש! 🎯
            </button>
          </div>
        </div>
      )}

      {/* כפתורים */}
      <div className="flex flex-col space-y-4 w-full max-w-sm md:flex-row md:space-x-4 md:space-y-0">
        <button
          onClick={getRandomSong}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center w-full"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="white"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            isGuessed ? "שיר הבא 🎶" : "הגרל שיר 🎲"
          )}
        </button>

        {isGuessed && (
          <button
            onClick={() => setIsGuessed(false)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition w-full"
          >
            הפוך חזרה 🔄
          </button>
        )}
      </div>

      {!song && !loading && (
        <p className="mt-4 text-red-400">הגרל שיר כדי להתחיל!</p>
      )}
    </div>
  );
}
