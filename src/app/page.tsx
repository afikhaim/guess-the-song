"use client";

import { useState, useCallback, useEffect } from "react";

// ממשק שיר מלא כולל השדה המספרי לשנה
export interface Song {
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string;
  releaseDate: string;
  releaseYear: number; 
}

// 🔹 פונקציית עזר לחילוץ השנה (בהנחה שזה פורמט תאריך תקין)
const extractYear = (dateStr: string): number => {
  const date = new Date(dateStr);
  // וודא שלא מחזיר NaN
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

  // 🔹 פונקציה לטעינת שיר חדש
  const getRandomSong = useCallback(async () => {
    setLoading(true);
    setIsGuessed(false);
    setUserGuess(null);
    setSong(null);
    setLastScore(null);

    let tracksToChoose = songs;

    try {
      // אם עדיין אין שירים - טען מה-API
      if (songs.length === 0) {
        const res = await fetch(`/api/itunes?term=ישראלי`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // **חשוב**: חילוץ השנה והוספתה לכל אובייקט שיר
        const songsWithYear: Song[] = data.songs.map((s: Omit<Song, 'releaseYear'>) => ({
          ...s,
          releaseYear: extractYear(s.releaseDate)
        }));
        
        setSongs(songsWithYear);
        tracksToChoose = songsWithYear;
      }
      
      // בחר שיר רנדומלי מהמערך
      const randomIndex = Math.floor(Math.random() * tracksToChoose.length);
      const chosen = tracksToChoose[randomIndex];
      
      if (chosen) setSong(chosen);

    } catch (err) {
      console.error("Error fetching song:", err);
    } finally {
      setLoading(false);
    }
  }, [songs]); 

  // טען שיר ראשון אוטומטית בעת טעינת הרכיב (אופציונלי)
  useEffect(() => {
    if (songs.length === 0) {
        getRandomSong();
    }
  }, [getRandomSong, songs.length]);
  

  // 🔹 פונקציית חישוב הניקוד
  const calculateScore = () => {
    // בדיקות תקינות
    if (!song || userGuess === null || isGuessed || String(userGuess).length !== 4) return;

    // הגדרות ניקוד
    const MAX_SCORE = 100;
    const PENALTY_PER_YEAR = 10;
    const MAX_DIFFERENCE_FOR_POINTS = 10; 

    const correctYear = song.releaseYear;
    const difference = Math.abs(correctYear - userGuess);

    let score = 0;

    if (difference <= MAX_DIFFERENCE_FOR_POINTS) {
      // נוסחת הניקוד: 100 פחות 10 נקודות על כל שנת פער
      score = MAX_SCORE - (PENALTY_PER_YEAR * difference);
    }

    // עדכון המצב
    setTotalScore((prevScore) => prevScore + score);
    setLastScore(score);
    setIsGuessed(true); // חושף את התשובה (מפעיל את ה-CSS של ה-flip)
  };

  // 🔹 פונקציה לעיצוב התאריך לתצוגה
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 🔹 פונקציית עזר להצגת מידע הניקוד
  const getFeedbackMessage = () => {
    if (!song || lastScore === null) return null;
    
    if (lastScore === 100) {
      return `🎉 ניחוש מושלם! 100 נקודות.`;
    } else if (lastScore > 0) {
      const diff = Math.abs(song.releaseYear - (userGuess ?? 0));
      return `✅ קרוב! קיבלת ${lastScore} נקודות. פער של ${diff} שנים.`;
    } else {
      return `❌ טעות גדולה. השנה הנכונה היא ${song.releaseYear}.`;
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center">
        🎵 נחש את השנה!
      </h1>
      <p className="text-sm text-yellow-400 mb-6 font-semibold">
        ניקוד: {totalScore}
      </p>

      {/* --- אזור כרטיס המשחק --- */}
      {/* **שינוי:** משתמש במחלקת 'guessed' להפעלת ה-CSS הגלובלי */}
      <div className={`
        flip-card 
        ${isGuessed ? "guessed" : ""} 
        mb-8 w-full max-w-sm md:max-w-md
      `}>
        <div className="flip-card-inner">
          
          {/* חזית: הצגת רמזים */}
          {/* **הערה:** הסרנו את ה-flex/center כי ה-CSS הגלובלי מטפל בפריסה */}
          <div className="flip-card-front p-8"> 
            {song ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                    מהי שנת היציאה של השיר?
                </h2>
                <img
                  src={song.cover}
                  alt={song.title}
                  className="rounded-2xl mx-auto shadow-lg mb-4 w-40 h-40 object-cover border-4 border-gray-700"
                />
                <p className="text-gray-300 text-lg">{song.artist}</p>
                <audio autoPlay controls src={song.preview} className="mx-auto mt-4 w-full">
                  הדפדפן שלך לא תומך בנגן אודיו
                </audio>
              </div>
            ) : (
              <h2 className="text-2xl font-bold">לחץ על 'הגרל שיר' למטה 👇</h2>
            )}
          </div>
          
          {/* גב: הצגת התשובה לאחר הניחוש */}
          {/* **הערה:** הסרנו את ה-flex/center כי ה-CSS הגלובלי מטפל בפריסה */}
          <div className="flip-card-back p-8"> 
            {song ? (
              <div className="text-center">
                <img
                  src={song.cover}
                  alt={song.title}
                  className="rounded-2xl mx-auto shadow-lg mb-4 w-40 h-40 object-cover border-4 border-green-500"
                />
                <h2 className="text-xl font-bold">{song.title}</h2>
                <p className="text-gray-400 mb-2">{song.artist}</p>
                <p className="text-lg font-extrabold text-green-400 mt-2">
                    שנת יציאה: {song.releaseYear} 🗓️
                </p>
                <p className="text-sm text-gray-500">
                    ({formatDate(song.releaseDate)})
                </p>
                {lastScore !== null && (
                    <p className="mt-4 text-yellow-300 font-bold text-lg">
                        {getFeedbackMessage()}
                    </p>
                )}
              </div>
            ) : (
              <p className="text-lg">הגרל שיר כדי לראות אותו כאן!</p>
            )}
          </div>
        </div>
      </div>

      {/* --- אזור הניחוש (מוצג רק לפני הניחוש) --- */}
      {song && !isGuessed && (
        <div className="guessing-area mt-4 mb-8 w-full max-w-sm p-4 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold mb-3 text-center">
            נחש את שנת היציאה!
          </h2>

          <div className="flex justify-center items-center gap-4">
            <input
              type="number"
              placeholder="שנה (YYYY)"
              value={userGuess || ''}
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

      {/* --- כפתורי שליטה --- */}
      <div className="flex flex-col space-y-4 w-full max-w-sm md:flex-row md:space-x-4 md:space-y-0">
        <button
          onClick={getRandomSong}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center w-full"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">...</svg> 
          ) : (
            isGuessed ? "שיר הבא 🎶" : "הגרל שיר 🎲"
          )}
        </button>
        
        {isGuessed && (
            <button
                onClick={() => setIsGuessed(false)}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition w-full"
            >
                הפוך קלף חזרה 🔄
            </button>
        )}
      </div>

      {!song && !loading && <p className="mt-4 text-red-400">הגרל שיר כדי להתחיל!</p>}
    </div>
  );
}