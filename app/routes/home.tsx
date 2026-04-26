import { Button } from "~/components/ui/button";
import { Upload } from "lucide-react";
import { useState, useRef, type ChangeEvent } from "react";
import { useHealth } from "~/hooks/use-health";
import { useBlur } from "~/hooks/use-blur";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const health = useHealth();
  const { processVideo, url, loading } = useBlur();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <nav className="text-2xl h-18 flex border-b">
        <h1 className="flex items-center pl-8">Blur that guy</h1>
      </nav>

      <div className="flex flex-1">
        <aside className="flex flex-col border-r w-1/6 px-4 py-4">
          <p className="text-xs mb-2">
            Backend:
            {health ? (
              <span className="text-xs pl-1 text-green-500 font-semibold">running</span>
            ) : (
              <span className="text-xs pl-1 text-red-500 font-semibold">down</span>
            )}
          </p>
          <div
            onClick={handleClick}
            className="cursor-pointer border text-gray-500 text-sm flex flex-col justify-center items-center rounded-xl border-dashed h-32 hover:bg-gray-50"
          >
            <Upload size={18} />
            <p>Select video</p>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1" />

          <Button disabled={!file} onClick={() => processVideo(file!)}>
            Process video
          </Button>
        </aside>
        <div className="m-4 flex-1 flex justify-center items-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Processing video...</p>
            </div>
          ) : url ? (
            <video src={url} controls autoPlay className="max-h-full max-w-full rounded-xl" />
          ) : file ? (
            <video
              src={URL.createObjectURL(file)}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-xl"
            />
          ) : (
            <p className="text-gray-500 text-sm">No video uploaded yet</p>
          )}
        </div>
      </div>
    </main>
  );
}
