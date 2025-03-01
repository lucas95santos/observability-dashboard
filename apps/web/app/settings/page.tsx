import { Shell } from "../../components/layout/shell";

export default function SettingsPage() {
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>
          Configuration options coming soon.
        </p>
      </div>
    </Shell>
  );
}
