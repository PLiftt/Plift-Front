import React, { createContext, useContext, useState, useCallback } from "react";

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: number;
  read?: boolean;
};

type AIChatState = {
  messages: AIChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AIChatMessage[]>>;
  unread: number;
  setUnread: React.Dispatch<React.SetStateAction<number>>;
  pendingAdjustments: any[];
  setPendingAdjustments: React.Dispatch<React.SetStateAction<any[]>>;
};

const Ctx = createContext<AIChatState | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);

  return (
    <Ctx.Provider
      value={{ messages, setMessages, unread, setUnread, pendingAdjustments, setPendingAdjustments }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAIChat() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAIChat must be used within AIChatProvider");
  return v;
}

