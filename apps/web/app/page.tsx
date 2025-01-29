import { Shell } from "../components/layout/shell";

export default function Home() {
  return (
    <Shell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--fg-muted)",
          }}
        >
          Select a view from the sidebar.
        </p>
      </div>
    </Shell>
  );
}
