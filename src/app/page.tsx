"use client";

import { useState } from "react";

export interface Song {
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string;
  releaseDate: string;
}

export default function Home() {
  const [song, setSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // 🔹 מגריל שיר רנדומלי ממילת חיפוש (לדוגמה "pop" או "hits")
  const getRandomSong = async () => {
    setLoading(true);
    setIsFlipped(false);
    setSong(null);

    try {
      // אם עדיין לא טענו שירים – נטען מאפל
      if (songs.length === 0) {
        const res = await fetch(`/api/itunes?term=pop`);
        const data = await res.json();

        if (data.error) {
          console.error("iTunes API error:", data.error);
          return;
        }

        setSongs(data.songs);
      }

      // נבחר שיר רנדומלי
      const randomIndex = Math.floor(Math.random() * (songs.length || 10));
      const chosen = songs[randomIndex];
      setSong(chosen);
      console.log("chosen song:", chosen);
    } catch (err) {
      console.error("Error fetching song:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlipCard = () => {
    if (song && !loading) setIsFlipped(!isFlipped);
    else if (!song && !loading) alert("הגרל שיר קודם!");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎵 נחש את השיר</h1>

      <div className={`flip-card ${isFlipped ? "flipped" : ""} mb-8`}>
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <h2 className="text-2xl font-bold mb-4">לחץ כדי לגלות!</h2>
          </div>
          <div className="flip-card-back">
            {song ? (
              <div className="text-center">
                <img
                  src={song.cover}
                  alt={song.title}
                  className="rounded-2xl mx-auto shadow-lg mb-4 w-40 h-40 object-cover"
                />
                <h2 className="text-xl font-bold">{song.title}</h2>
                <p className="text-gray-400 mb-4">{song.artist}</p>
                <p className="text-xs text-gray-500 mb-4">
                  נוצר: {formatDate(song.releaseDate)} 🗓️
                </p>
                <audio autoPlay controls src={song.preview} className="mx-auto mt-2">
                  הדפדפן שלך לא תומך בנגן אודיו
                </audio>
              </div>
            ) : (
              <p className="text-lg">הגרל שיר כדי לראות אותו כאן!</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={getRandomSong}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
                3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            "הגרל שיר 🎲"
          )}
        </button>

        <button
          onClick={handleFlipCard}
          disabled={loading || !song}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition"
        >
          {isFlipped ? "הפוך חזרה" : "הפוך קלף 🔄"}
        </button>
      </div>

      {!song && !loading && <p className="mt-4 text-red-400">הגרל שיר כדי להתחיל!</p>}
      {song && !isFlipped && (
        <p className="mt-4 text-gray-400">לחץ על "הפוך קלף" כדי לגלות את השיר!</p>
      )}
    </div>
  );
}
