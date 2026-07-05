export function Spinner({ size = 12 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/25 border-t-sky-400"
      style={{ width: size, height: size }}
    />
  );
}
