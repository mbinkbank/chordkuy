import { useEffect, useId, useRef, useState } from "react";
import type { Song } from "../data/types";
import { searchCatalogue } from "../lib/api";
import { Link, navigate } from "../lib/router";
import { Search } from "lucide-react";

interface Props {
  initialValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  /** When set, typing filters in place instead of navigating. */
  onQueryChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export default function SearchBar({
  initialValue = "",
  size = "md",
  autoFocus = false,
  onQueryChange,
  label = "Cari lagu, artis, atau genre",
  placeholder = "Cari judul lagu atau artis…",
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const inputId = useId();
  const listId = `${inputId}-list`;
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    let cancel = false;
    if (!onQueryChange && value.trim().length >= 2) {
      searchCatalogue(value, 6).then((res) => {
        if (!cancel && res && res.songs) {
          setSuggestions(res.songs);
        }
      });
    } else {
      setSuggestions([]);
    }
    return () => {
      cancel = true;
    };
  }, [value, onQueryChange]);

  useEffect(() => {
    const onDocClick = (event: globalThis.MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    if (active >= 0 && suggestions[active]) {
      setOpen(false);
      navigate(`/chord/${suggestions[active].slug}`);
      return;
    }
    setOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <form role="search" onSubmit={submit} className={size === "lg" ? "searchbar searchbar-lg" : "searchbar"}>
        <span className="prefix" aria-hidden="true" style={{ display: "grid", placeItems: "center" }}>
          <Search size={16} strokeWidth={2.2} />
        </span>
        <input
          id={inputId}
          type="search"
          name="q"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={placeholder}
          aria-label={label}
          aria-autocomplete="list"
          aria-controls={suggestions.length ? listId : undefined}
          aria-expanded={open && suggestions.length > 0}
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
            onQueryChange?.(event.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button className="btn" type="submit">
          Cari
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div
          id={listId}
          className="suggestions"
          role="listbox"
          aria-label="Saran pencarian"
          style={{ position: "absolute", left: 0, right: 0, zIndex: 35 }}
        >
          {suggestions.map((song, index) => (
            <Link
              key={song.id}
              href={`/chord/${song.slug}`}
              className="suggestion"
              role="option"
              aria-selected={index === active}
              data-active={index === active}
              onClick={() => setOpen(false)}
            >
              <strong style={{ fontWeight: 600 }}>{song.title}</strong>
              <span className="muted">— {song.artist}</span>
              <span className="muted" style={{ marginLeft: "auto" }}>
                {song.originalKey}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
