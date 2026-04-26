import { Button } from "~/components/ui/button";
import { Upload } from "lucide-react";
import { useState, useRef, type ChangeEvent } from "react";
import { useHealth } from "~/hooks/use-health";
import { useBlur } from "~/hooks/use-blur";
import { useFaces } from "~/hooks/use-faces";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedFaceIds, setSelectedFaceIds] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const health = useHealth();
  const { processVideo, url, loading: blurLoading } = useBlur();
  const { detectFaces, faces, sessionId, loading: facesLoading } = useFaces();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const f = e.target.files[0];
      setFile(f);
      setSelectedFaceIds([]);
      await detectFaces(f);
    }
  };

  const toggleFace = (id: number) => {
    setSelectedFaceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <nav className="text-2xl h-18 flex border-b">
        <h1 className="flex items-center pl-8">Blur that guy</h1>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex flex-col border-r w-1/5 px-4 py-4 overflow-hidden">
          <p className="text-xs mb-3">
            Backend:
            {health ? (
              <span className="text-xs pl-1 text-green-500 font-semibold">running</span>
            ) : (
              <span className="text-xs pl-1 text-red-500 font-semibold">down</span>
            )}
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer border text-gray-500 text-sm flex flex-col justify-center items-center rounded-xl border-dashed h-32 hover:bg-gray-50 shrink-0"
          >
            <Upload size={18} />
            <p>{file ? file.name : "Select video"}</p>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="mt-4 flex-1 overflow-y-auto">
            {facesLoading ? (
              <div className="flex flex-col items-center gap-2 mt-4 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Detecting faces...</p>
              </div>
            ) : faces.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Select faces to blur:</p>
                {faces.map((face) => (
                  <button
                    key={face.id}
                    onClick={() => toggleFace(face.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      selectedFaceIds.includes(face.id)
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={`data:image/jpeg;base64,${face.thumbnail}`}
                      alt={`Face ${face.id + 1}`}
                      className="w-12 h-12 rounded-md object-cover shrink-0"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium">Person {face.id + 1}</p>
                      <p className="text-xs text-gray-400">{face.count} detections</p>
                    </div>
                    <div
                      className={`ml-auto w-4 h-4 rounded border shrink-0 ${
                        selectedFaceIds.includes(face.id)
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Button
            disabled={!file || !sessionId || selectedFaceIds.length === 0 || blurLoading}
            onClick={() => processVideo(file!, sessionId!, selectedFaceIds)}
            className="mt-4 shrink-0"
          >
            {blurLoading ? "Processing..." : "Process video"}
          </Button>
        </aside>

        <div className="m-4 flex-1 flex justify-center items-center">
          {blurLoading ? (
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
