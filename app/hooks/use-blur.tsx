import { useState } from "react";

export function useBlur() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function processVideo(file: File) {
    setLoading(true);
    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch("http://localhost:8000/blur", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    setUrl(URL.createObjectURL(blob));
    setLoading(false);
  }

  return { processVideo, url, loading };
}
