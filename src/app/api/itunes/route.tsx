import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term"); // לדוגמה: /api/itunes?term=eminem

    if (!term) {
      return NextResponse.json(
        { error: "Missing 'term' query parameter (e.g., ?term=eminem)" },
        { status: 400 }
      );
    }

    // פנייה ל־iTunes Search API
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "iTunes API returned an error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // עיבוד התוצאות כדי להחזיר רק מידע רלוונטי
    const songs = data.results.map((song: any) => ({
      title: song.trackName,
      artist: song.artistName,
      album: song.collectionName,
      cover: song.artworkUrl100,
      preview: song.previewUrl,
      releaseDate: song.releaseDate,
    }));

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Error fetching from iTunes:", error);
    return NextResponse.json(
      { error: "Failed to fetch from iTunes" },
      { status: 500 }
    );
  }
}
