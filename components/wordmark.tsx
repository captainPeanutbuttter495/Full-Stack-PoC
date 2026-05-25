export default function Wordmark() {
  return (
    <div className="pwyw-row pwyw-gap-2 pwyw-items-center">
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--accent)",
          display: "inline-block",
        }}
      />
      <span className="pwyw-font-medium pwyw-tracking-tight pwyw-text-base">
        Openleaf
      </span>
    </div>
  );
}
