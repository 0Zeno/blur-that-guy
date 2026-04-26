import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";
import { Upload } from 'lucide-react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blur that guy" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
<main className="h-screen flex flex-col overflow-hidden">
  <nav className="text-2xl h-18 flex border-b">
    <h1 className="flex items-center pl-8">
      Blur that guy
    </h1>
  </nav>

  <div className="flex flex-1">
    <aside className="flex flex-col border-r w-1/6 px-4 pt-4 space-y-2">
      <button className="border text-gray-500  text-sm flex flex-col justify-center items-center rounded-xl border-dashed h-32">
        <Upload size={18}/>
        <p>Upload video</p>
      </button>
      <Button >Process video</Button>
    </aside>

    <div className="m-4 flex-1 border text-gray-500 bg-gray-100 rounded-xl flex justify-center items-center">
      <p>No video uploaded yet {":("}</p>
    </div>
  </div>
</main>
  );
}
