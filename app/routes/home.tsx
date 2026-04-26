import { Button } from "~/components/ui/button";
import { Upload } from "lucide-react";
import { useState, useRef, type ChangeEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        <aside className="flex flex-col border-r w-1/6 px-4 pt-4 space-y-2">
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

          <Button disabled={!file}>Process video</Button>
        </aside>
        <div className="m-4 flex-1 border text-gray-500 bg-gray-100 rounded-xl flex justify-center items-center">
          {file ? (
            <video
              src={URL.createObjectURL(file)}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-xl"
            />
          ) : (
            <p>No video uploaded yet :(</p>
          )}
        </div>
      </div>
    </main>
  );
}
