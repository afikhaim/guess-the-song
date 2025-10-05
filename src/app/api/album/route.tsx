// app/api/deezer/route.ts

import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        // 1. קבלת פרמטרי ה-Query מה-URL של הבקשה (request)
        const { searchParams } = new URL(request.url);

        // 2. שליפת מזהה הפלייליסט (id) מהפרמטרים
        // הלקוח קורא: /api/deezer?id=908622995
        const albumId = searchParams.get('id');

        // בדיקת ולידציה בסיסית
        if (!albumId) {
            return NextResponse.json({ error: "Album ID is missing in the query parameters (e.g., ?id=...)" }, { status: 400 });
        }

        // 3. שימוש במזהה הפלייליסט המשתנה בבקשה ל-Deezer
        const res = await fetch(`https://api.deezer.com/album/${albumId}`, {
            headers: {
                "Accept": "application/json",
            },
        });

        if (!res.ok) {
            // Deezer החזיר שגיאה (כגון 404 אם הפלייליסט לא נמצא)
            const errorData = await res.json();
            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching from Deezer:", error);
        return NextResponse.json({ error: "Failed to fetch from Deezer" }, { status: 500 });
    }
}