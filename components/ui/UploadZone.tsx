"use client";

import { useRef, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBanner } from "./ErrorBanner";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isParsing: boolean;
  errorMessage?: string;
}

export function UploadZone({
  onFileSelected,
  isParsing,
  errorMessage,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      return;
    }
    onFileSelected(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo / App name */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow-indigo">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Shopify Dashboard
          </h1>
          <p className="mt-2 text-gray-400">
            AI-powered analytics for your Shopify store
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isParsing && inputRef.current?.click()}
          className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
            isDragging
              ? "upload-zone-drag"
              : "upload-zone-idle border-indigo-500/40 bg-white/[0.03]"
          } ${isParsing ? "cursor-not-allowed opacity-70" : "hover:border-indigo-400/60 hover:bg-white/[0.05]"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onInputChange}
            disabled={isParsing}
          />

          {isParsing ? (
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm font-medium text-indigo-300">
                Parsing your CSV…
              </p>
            </div>
          ) : (
            <>
              {/* Upload icon */}
              <div
                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isDragging
                    ? "bg-indigo-500/30 text-indigo-300"
                    : "bg-indigo-500/15 text-indigo-400"
                }`}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>

              <p className="text-lg font-semibold text-white">
                {isDragging ? "Drop it here!" : "Drop your Shopify CSV here"}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                or{" "}
                <span className="text-indigo-400 underline underline-offset-2">
                  click to browse
                </span>
              </p>
              <p className="mt-4 text-xs text-gray-600">
                Export from Shopify Admin → Orders → Export → All orders
              </p>
            </>
          )}
        </div>

        {/* Feature pills */}
        {!isParsing && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "Revenue Analytics",
              "Top Products",
              "Market Breakdown",
              "AI Insights",
            ].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-gray-500"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Error */}
        {errorMessage && !isParsing && (
          <div className="mt-5">
            <ErrorBanner message={errorMessage} />
          </div>
        )}
      </div>
    </div>
  );
}
