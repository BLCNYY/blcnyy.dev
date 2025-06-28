"use client";

import { cn } from "@/lib/utils";
import "@fontsource/jetbrains-mono";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src="/background.png" 
          alt="Background" 
          fill 
          priority
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div>
      <div className="flex flex-col items-center justify-center gap-4 text-center z-10 relative">
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
              "group flex items-center gap-2 px-6 py-2 rounded-full",
              "bg-black text-white hover:bg-gray-800",
              "font-medium transition-all duration-300 ease-in-out",
              "hover:scale-110 hover:shadow-xl hover:shadow-purple-300/30",
              "border-2 border-transparent hover:border-white/20",
              "relative overflow-hidden"
            )}
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="relative z-10">Visit</span>
            <div className="relative w-4 h-4 z-10 transition-all duration-300 group-hover:rotate-12 group-hover:scale-125">
              <Image
                src="/x-logo-new.png"
                alt="X Logo"
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </a>
          <a
            href="mailto:hi@blcnyy.dev"
            className={cn(
              "group flex items-center gap-2 px-6 py-2 rounded-full",
              "bg-black text-white hover:bg-gray-800",
              "font-medium transition-all duration-300 ease-in-out",
              "hover:scale-110 hover:shadow-xl hover:shadow-purple-300/30",
              "border-2 border-transparent hover:border-white/20",
              "relative overflow-hidden"
            )}
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="relative z-10">Contact</span>
            <Mail
              size={16}
              className="relative w-4 h-4 z-10 transition-all duration-300 group-hover:rotate-12 group-hover:scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </a>
        </div>
      </div>
    </main>
  );
}
