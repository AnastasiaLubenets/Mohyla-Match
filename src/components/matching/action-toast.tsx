"use client";

import { useEffect, useRef, useState } from "react";

import {
  toastExitMs,
  toastVisibleMs,
  type ActionToast,
  type ActionToastInput,
} from "@/lib/matching/action-toast";

const actionToastEventName = "mohyla:action-toast";

type ActionToastEvent = CustomEvent<ActionToastInput>;

function isActionToastEvent(event: Event): event is ActionToastEvent {
  return (
    "detail" in event &&
    typeof event.detail === "object" &&
    event.detail !== null &&
    "message" in event.detail &&
    typeof event.detail.message === "string"
  );
}

function createToast(input: ActionToastInput): ActionToast {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    message: input.message,
    tone: input.tone ?? "success",
  };
}

function clearTransientSearchParams(paramNames: readonly string[]) {
  if (paramNames.length === 0 || typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let changed = false;

  paramNames.forEach((paramName) => {
    if (url.searchParams.has(paramName)) {
      url.searchParams.delete(paramName);
      changed = true;
    }
  });

  if (changed) {
    window.history.replaceState(window.history.state, "", url.toString());
  }
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function showActionToast(input: ActionToastInput) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(actionToastEventName, {
      detail: input,
    }),
  );
}

export function ActionToastViewport({
  clearSearchParams = [],
  initialToast,
}: Readonly<{
  clearSearchParams?: readonly string[];
  initialToast?: ActionToast | null;
}>) {
  const [toast, setToast] = useState<ActionToast | null>(initialToast ?? null);
  const [exiting, setExiting] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSearchParamKey = clearSearchParams.join("\u0000");

  useEffect(() => {
    function clearTimers() {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      if (removeTimer.current) {
        clearTimeout(removeTimer.current);
      }
    }

    function schedule(nextToast: ActionToast) {
      clearTimers();
      setExiting(false);
      setToast(nextToast);

      hideTimer.current = setTimeout(() => {
        setExiting(true);
        removeTimer.current = setTimeout(() => {
          setToast(null);
        }, toastExitMs);
      }, toastVisibleMs);
    }

    if (initialToast) {
      schedule(initialToast);
      clearTransientSearchParams(
        clearSearchParamKey ? clearSearchParamKey.split("\u0000") : [],
      );
    }

    function handleToast(event: Event) {
      if (!isActionToastEvent(event)) {
        return;
      }

      schedule(createToast(event.detail));
    }

    window.addEventListener(actionToastEventName, handleToast);

    return () => {
      clearTimers();
      window.removeEventListener(actionToastEventName, handleToast);
    };
  }, [
    clearSearchParamKey,
    initialToast,
    initialToast?.id,
    initialToast?.message,
    initialToast?.tone,
  ]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4 sm:bottom-6"
      role="status"
    >
      {toast ? (
        <div
          className={
            exiting
              ? "inline-flex max-w-[min(22rem,calc(100vw-2rem))] translate-y-2 items-center gap-2 rounded-full bg-blue-950/90 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg ring-1 ring-white/10 backdrop-blur transition duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:transition-none"
              : "inline-flex max-w-[min(22rem,calc(100vw-2rem))] translate-y-0 items-center gap-2 rounded-full bg-blue-950/90 px-4 py-2 text-sm font-semibold text-white opacity-100 shadow-lg ring-1 ring-white/10 backdrop-blur transition duration-200 ease-out motion-reduce:transition-none"
          }
        >
          {toast.tone === "success" ? <CheckIcon /> : null}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
