"use client";

import { useEffect, useRef, useState } from "react";

import { WS_BASE_URL } from "@/lib/api";
import type { Quote } from "@/types/market";

export function useLiveQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (!symbolsKey) return;

    const socket = new WebSocket(`${WS_BASE_URL}/ws/prices`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "subscribe", symbols: symbolsKey.split(",") }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "quote") {
        const quote = message.data as Quote;
        setQuotes((prev) => ({ ...prev, [quote.symbol]: quote }));
      }
    };

    return () => {
      socket.close();
    };
  }, [symbolsKey]);

  return quotes;
}
