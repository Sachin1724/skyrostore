"use client";

// Last-resort page when the root layout itself fails, so it carries its own <html> and plain styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, padding: 16, textAlign: "center" }}>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 28 }}>Skyrostore is having a problem</h1>
          <p style={{ color: "#555" }}>Please try again in a moment. Your cart is safe.</p>
          <button type="button" onClick={reset} style={{ padding: "12px 20px", background: "#111", color: "#fff", border: 0, cursor: "pointer" }}>
            Try again
          </button>
          {error.digest ? <p style={{ fontFamily: "monospace", fontSize: 12, color: "#777" }}>Reference: {error.digest}</p> : null}
        </div>
      </body>
    </html>
  );
}
