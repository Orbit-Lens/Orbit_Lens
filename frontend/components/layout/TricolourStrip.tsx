export function TricolourStrip() {
  return (
    <div className="w-full flex h-[6px] shrink-0" role="presentation" aria-hidden="true">
      <div className="flex-1 bg-saffron h-full" />
      <div className="flex-1 bg-white h-full border-t border-b border-border-light" />
      <div className="flex-1 bg-india-green h-full" />
    </div>
  );
}
