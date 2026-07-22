export function shirtNumber(slotIndex: number): number {
  // Slot order runs GK → defence → midfield → attack, so 1..11 reads as a
  // conventional team sheet (keeper 1, back line 2-5, and so on).
  return slotIndex + 1;
}

export function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export function KitToken({ number }: { number: number }) {
  return (
    <div className="kit">
      <svg viewBox="0 0 46 44" aria-hidden="true">
        {/* back of a shirt: body + two sleeves + collar notch */}
        <path
          d="M13 4 L18 2 Q23 6 28 2 L33 4 L44 11 L39 18 L34 15 L34 42 L12 42 L12 15 L7 18 L2 11 Z"
          fill="#eef2ea"
          stroke="#cdd6cc"
          strokeWidth="0.8"
        />
        <path d="M18 2 Q23 6 28 2 L26 6 Q23 8 20 6 Z" fill="#e6b24c" />
      </svg>
      <span className="num">{number}</span>
    </div>
  );
}
