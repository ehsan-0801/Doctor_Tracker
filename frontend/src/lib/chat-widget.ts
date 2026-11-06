"use client";

import { useSyncExternalStore } from "react";

/** Floating chat widget state, shared by the widget and real-time notifications. */
export interface ChatWidgetState {
  open: boolean;
  conversationId: string | null;
}

let state: ChatWidgetState = { open: false, conversationId: null };
const listeners = new Set<() => void>();
const set = (next: ChatWidgetState) => {
  state = next;
  listeners.forEach((l) => l());
};

export const chatWidget = {
  get: () => state,
  open: (conversationId: string | null = state.conversationId) => set({ open: true, conversationId }),
  showList: () => set({ open: true, conversationId: null }),
  close: () => set({ ...state, open: false }),
  toggle: () => set({ ...state, open: !state.open }),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const SERVER_STATE: ChatWidgetState = { open: false, conversationId: null };

export function useChatWidget(): ChatWidgetState {
  return useSyncExternalStore(subscribe, chatWidget.get, () => SERVER_STATE);
}
