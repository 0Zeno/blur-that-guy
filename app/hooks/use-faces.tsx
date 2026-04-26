import { useState } from "react";

export type Face = {
  id: number;
  thumbnail: string;
  count: number;
};

export function useFaces() {
  const [faces, setFaces] = useState<Face[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function detectFaces(file: File) {
    setLoading(true);
    setFaces([]);
    setSessionId(null);
    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch("http://localhost:8000/faces", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setFaces(data.faces);
    setSessionId(data.session_id);
    setLoading(false);
  }

  return { detectFaces, faces, sessionId, loading };
}
