"use client";

/**
 * EmojiPicker — a small custom 24-emoji grid.
 * No external libraries. Consistent cross-platform.
 * Opens as an inline popover next to the trigger.
 */

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// 4 rows × 6 columns = 24 emoji. Warm, expressive, no flags or food.
const EMOJI_GRID = [
  ["❤️", "😍", "🥰", "😂", "😮", "😢"],
  ["🔥", "✨", "💯", "👏", "🤍", "💭"],
  ["🌙", "🌅", "🤔", "😶", "🫂", "🌿"],
  ["✦",  "💌", "🎭", "🌊", "🕊️", "🪐"],
];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  function handleSelect(emoji: string) {
    onSelect(emoji);
    onClose();
  }

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Picker card */}
      <div
        role="dialog"
        aria-label="Pick an emoji reaction"
        className="absolute bottom-full left-0 mb-2 z-50 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-2"
        style={{ minWidth: 216 }}
      >
        <div className="flex flex-col gap-1">
          {EMOJI_GRID.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl rounded hover:bg-[var(--bg-sunken)] transition-colors"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
