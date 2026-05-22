"use client";
import { useEffect, useRef, useState } from "react";
import { SEC_KEY } from "./honeypot";

/**
 * Hook + component that adds invisible bot protection to a form without
 * changing its UX for real users.
 *
 *   const sec = useFormSecurity();
 *   <form onSubmit={...}>
 *     <sec.Honeypot />
 *     ...real fields...
 *   </form>
 *
 *   // when submitting:
 *   body: JSON.stringify({ ...formValues, [SEC_KEY]: sec.payload() })
 */

function makeNonce(): string {
  // Tiny client-only nonce. Doesn't need to be cryptographic — it just
  // proves "JS ran in a real browser environment". 16 chars of [a-z0-9].
  if (typeof window === "undefined") return "";
  let s = "";
  const arr = new Uint8Array(8);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(arr);
    for (const b of arr) s += b.toString(36).padStart(2, "0");
  } else {
    for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 256).toString(36).padStart(2, "0");
  }
  return s.slice(0, 16);
}

export function useFormSecurity() {
  const mountedAt = useRef<number>(0);
  const [nonce, setNonce] = useState<string>("");
  const hpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    setNonce(makeNonce());
  }, []);

  function payload() {
    return {
      hp: hpRef.current?.value ?? "",
      t:  mountedAt.current ? Date.now() - mountedAt.current : 0,
      n:  nonce,
    };
  }

  // Honeypot input. Hidden via aria + tabIndex + CSS, never seen by humans
  // or visible-DOM bots. `autoComplete="off"` blocks browser autofill, but
  // we use a non-suggestive label/name to avoid AI-driven form fillers.
  function Honeypot() {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <label htmlFor="website-url-field">Leave this field empty</label>
        <input
          ref={hpRef}
          id="website-url-field"
          name="website_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
    );
  }

  return { Honeypot, payload, SEC_KEY };
}
