"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import "@fontsource/jetbrains-mono";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-purple-100 to-blue-200">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          blcnyy.dev
        </h1>
        <p className="text-xl" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          You can just cook things
        </p>
        
        <div className="mt-4 flex items-center gap-2">
          <a 
            href="https://x.com/blcnyy" 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full",
              "bg-black text-white hover:bg-gray-800 transition-colors",
              "font-medium"
            )}
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Visit
            <X size={18} />
          </a>
        </div>
      </div>
    </main>
  );
}
