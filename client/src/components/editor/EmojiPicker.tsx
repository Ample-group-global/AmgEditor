import { useEffect, useRef, useState } from "react";

// Emoji shortcode map (mirrored from converters.ts)
const EMOJI_MAP: Record<string, string> = {
  // Smileys
  smile: "\u{1F604}", grinning: "\u{1F600}", joy: "\u{1F602}", heart_eyes: "\u{1F60D}",
  wink: "\u{1F609}", thinking: "\u{1F914}", sunglasses: "\u{1F60E}", sweat_smile: "\u{1F605}",
  laughing: "\u{1F606}", rofl: "\u{1F923}", blush: "\u{1F60A}", innocent: "\u{1F607}",
  // Hands
  thumbsup: "\u{1F44D}", "+1": "\u{1F44D}", thumbsdown: "\u{1F44E}", "-1": "\u{1F44E}",
  clap: "\u{1F44F}", wave: "\u{1F44B}", ok_hand: "\u{1F44C}", raised_hands: "\u{1F64C}",
  pray: "\u{1F64F}", muscle: "\u{1F4AA}", point_up: "\u261D\uFE0F", point_down: "\u{1F447}",
  point_left: "\u{1F448}", point_right: "\u{1F449}",
  // Objects
  rocket: "\u{1F680}", fire: "\u{1F525}", star: "\u2B50", sparkles: "\u2728",
  heart: "\u2764\uFE0F", broken_heart: "\u{1F494}", bomb: "\u{1F4A3}",
  bulb: "\u{1F4A1}", lightbulb: "\u{1F4A1}", gem: "\u{1F48E}",
  key: "\u{1F511}", lock: "\u{1F512}", unlock: "\u{1F513}",
  bell: "\u{1F514}", trophy: "\u{1F3C6}", medal: "\u{1F3C5}",
  // Symbols & Arrows
  check: "\u2705", white_check_mark: "\u2705", heavy_check_mark: "\u2714\uFE0F",
  x: "\u274C", warning: "\u26A0\uFE0F", exclamation: "\u2757",
  question: "\u2753", info: "\u2139\uFE0F", no_entry: "\u26D4",
  arrow_left: "\u2B05\uFE0F", arrow_right: "\u27A1\uFE0F",
  arrow_up: "\u2B06\uFE0F", arrow_down: "\u2B07\uFE0F",
  arrow_upper_left: "\u2196\uFE0F", arrow_upper_right: "\u2197\uFE0F",
  arrow_lower_left: "\u2199\uFE0F", arrow_lower_right: "\u2198\uFE0F",
  // Misc
  tada: "\u{1F389}", party_popper: "\u{1F389}", confetti_ball: "\u{1F38A}",
  gift: "\u{1F381}", balloon: "\u{1F388}", ribbon: "\u{1F380}",
  memo: "\u{1F4DD}", pencil: "\u270F\uFE0F", pencil2: "\u270F\uFE0F",
  book: "\u{1F4D6}", books: "\u{1F4DA}", bookmark: "\u{1F516}",
  link: "\u{1F517}", paperclip: "\u{1F4CE}", scissors: "\u2702\uFE0F",
  pushpin: "\u{1F4CC}", pin: "\u{1F4CC}", round_pushpin: "\u{1F4CD}",
  mag: "\u{1F50D}", mag_right: "\u{1F50E}",
  wrench: "\u{1F527}", hammer: "\u{1F528}", gear: "\u2699\uFE0F",
  // Tech
  computer: "\u{1F4BB}", keyboard: "\u2328\uFE0F", video_game: "\u{1F3AE}",
  joystick: "\u{1F579}\uFE0F", phone: "\u{1F4F1}", email: "\u{1F4E7}",
  inbox_tray: "\u{1F4E5}", outbox_tray: "\u{1F4E4}",
  package: "\u{1F4E6}", bug: "\u{1F41B}", robot: "\u{1F916}",
  // Weather/Nature
  sunny: "\u2600\uFE0F", cloud: "\u2601\uFE0F", rain: "\u{1F327}\uFE0F",
  zap: "\u26A1", snowflake: "\u2744\uFE0F", rainbow: "\u{1F308}",
  earth_americas: "\u{1F30E}", earth_asia: "\u{1F30F}",
  // Food
  coffee: "\u2615", pizza: "\u{1F355}", beer: "\u{1F37A}",
  // People
  eyes: "\u{1F440}", brain: "\u{1F9E0}",
};

const EMOJI_ENTRIES = Object.entries(EMOJI_MAP);

interface EmojiPickerProps {
  query: string; // text after ":"
  position: { top: number; left: number } | null;
  onSelect: (emoji: string, name: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ query, position, onSelect, onClose }: EmojiPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter emojis by query (minimum 2 chars)
  const filtered = query.length >= 2
    ? EMOJI_ENTRIES.filter(([name]) => name.includes(query.toLowerCase())).slice(0, 8)
    : [];

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!position || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filtered.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const [name, emoji] = filtered[selectedIndex];
          onSelect(emoji, name);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [position, filtered, selectedIndex, onSelect, onClose]);

  if (!position || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover rounded-lg border shadow-xl animate-in fade-in zoom-in-95 duration-100 p-1 min-w-[200px]"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseDown={e => e.preventDefault()}
    >
      {filtered.map(([name, emoji], index) => (
        <div
          key={name}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent"
          }`}
          onClick={() => onSelect(emoji, name)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="text-lg">{emoji}</span>
          <span className="text-muted-foreground font-mono text-xs">:{name}:</span>
        </div>
      ))}
    </div>
  );
}
