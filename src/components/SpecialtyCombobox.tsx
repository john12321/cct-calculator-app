import {
  useEffect,
  useId,
  useRef,
  useState,
  type FC,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import { specialtiesGroupedBySchool, type Specialty } from "../core";

type SpecialtyComboboxProps = {
  value: string;
  onChange: (name: string) => void;
  inputId?: string;
};

type IndexedGroup = {
  school: string;
  items: Array<{ item: Specialty; index: number }>;
};

type OptionRowProps = {
  item: Specialty;
  index: number;
  listboxId: string;
  isHighlighted: boolean;
  onCommit: (item: Specialty) => void;
  onHighlight: (index: number) => void;
  registerRef: (el: HTMLDivElement | null, index: number) => void;
};

const NHS_BLUE = "#005eb8";
const NHS_BLUE_DARK = "#003087";
const NHS_GREY_5 = "#f0f4f5";
const NHS_GREY_2 = "#4c6272";
const NHS_TEXT = "#212b32";

const matches = (name: string, query: string) =>
  name.toLowerCase().includes(query.trim().toLowerCase());

const buildIndexedGroups = (
  groups: ReturnType<typeof specialtiesGroupedBySchool>
): IndexedGroup[] => {
  let idx = -1;
  return groups.map(g => ({
    school: g.school,
    items: g.items.map(item => {
      idx += 1;
      return { item, index: idx };
    })
  }));
};

const OptionRow: FC<OptionRowProps> = ({
  item,
  index,
  listboxId,
  isHighlighted,
  onCommit,
  onHighlight,
  registerRef
}) => {
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    onCommit(item);
  };

  return (
    <div // NOSONAR: ARIA combobox pattern keeps focus on the input
      ref={el => registerRef(el, index)}
      id={`${listboxId}-option-${index}`}
      role="option" // NOSONAR
      aria-selected={isHighlighted}
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHighlight(index)}
      style={{
        padding: "10px 12px",
        cursor: "pointer",
        backgroundColor: isHighlighted ? NHS_BLUE : "white",
        color: isHighlighted ? "white" : NHS_TEXT,
        borderBottom: "1px solid #e8edee"
      }}
    >
      <div>{item.name}</div>
      {item.dual && (
        <div
          style={{
            fontSize: "0.85em",
            color: isHighlighted ? "#cfe2f3" : NHS_GREY_2,
            marginTop: 2
          }}
        >
          {item.dual}
        </div>
      )}
    </div>
  );
};

type ListboxProps = {
  listboxId: string;
  indexedGroups: IndexedGroup[];
  isEmpty: boolean;
  trimmedQuery: string;
  highlight: number;
  onCommit: (item: Specialty) => void;
  onHighlight: (index: number) => void;
  registerRef: (el: HTMLDivElement | null, index: number) => void;
};

const Listbox: FC<ListboxProps> = ({
  listboxId,
  indexedGroups,
  isEmpty,
  trimmedQuery,
  highlight,
  onCommit,
  onHighlight,
  registerRef
}) => (
  <div // NOSONAR: W3C ARIA combobox pattern uses role="listbox" on the popup
    id={listboxId}
    role="listbox" // NOSONAR
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      maxHeight: "320px",
      overflowY: "auto",
      background: "white",
      border: `2px solid ${NHS_BLUE}`,
      borderTop: "none",
      zIndex: 100,
      boxShadow: "0 4px 8px rgba(0,94,184,0.15)"
    }}
  >
    {isEmpty ? (
      <div
        style={{
          padding: "12px",
          color: NHS_GREY_2,
          fontStyle: "italic"
        }}
      >
        No specialties match "{trimmedQuery}"
      </div>
    ) : (
      indexedGroups.map(group => (
        <div key={group.school}>
          <div
            style={{
              padding: "6px 12px",
              backgroundColor: NHS_GREY_5,
              fontWeight: "bold",
              fontSize: "0.875em",
              color: NHS_BLUE_DARK,
              position: "sticky",
              top: 0
            }}
          >
            {group.school}
          </div>
          {group.items.map(({ item, index }) => (
            <OptionRow
              key={item.name}
              item={item}
              index={index}
              listboxId={listboxId}
              isHighlighted={highlight === index}
              onCommit={onCommit}
              onHighlight={onHighlight}
              registerRef={registerRef}
            />
          ))}
        </div>
      ))
    )}
  </div>
);

export const SpecialtyCombobox: FC<SpecialtyComboboxProps> = ({
  value,
  onChange,
  inputId
}) => {
  const generatedId = useId();
  const fieldId = inputId ?? `specialty-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;

  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const allGroups = specialtiesGroupedBySchool();
  const trimmedQuery = query.trim();
  const filteredGroups =
    trimmedQuery && trimmedQuery !== value
      ? allGroups
          .map(g => ({
            school: g.school,
            items: g.items.filter(item => matches(item.name, trimmedQuery))
          }))
          .filter(g => g.items.length > 0)
      : allGroups;

  const indexedGroups = buildIndexedGroups(filteredGroups);
  const flatItems: Specialty[] = filteredGroups.flatMap(g => g.items);

  useEffect(() => {
    if (
      highlight >= 0 &&
      highlight < itemRefs.current.length &&
      itemRefs.current[highlight]
    ) {
      itemRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlight]);

  const commit = (item: Specialty) => {
    setQuery(item.name);
    onChange(item.name);
    setIsOpen(false);
    setHighlight(-1);
  };

  const revert = () => {
    setQuery(value);
    setIsOpen(false);
    setHighlight(-1);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlight(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlight(prev => (prev <= 0 ? 0 : prev - 1));
    } else if (e.key === "Enter") {
      if (isOpen && highlight >= 0 && flatItems[highlight]) {
        e.preventDefault();
        commit(flatItems[highlight]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      revert();
    } else if (e.key === "Home" && isOpen) {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End" && isOpen) {
      e.preventDefault();
      setHighlight(flatItems.length - 1);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) return;
    revert();
  };

  const registerRef = (el: HTMLDivElement | null, index: number) => {
    itemRefs.current[index] = el;
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        className="nhsuk-input"
        id={fieldId}
        type="text"
        autoComplete="off"
        value={query}
        placeholder="Type to search a specialty…"
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKey}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && highlight >= 0 && flatItems[highlight]
            ? `${listboxId}-option-${highlight}`
            : undefined
        }
      />
      {isOpen && (
        <Listbox
          listboxId={listboxId}
          indexedGroups={indexedGroups}
          isEmpty={flatItems.length === 0}
          trimmedQuery={trimmedQuery}
          highlight={highlight}
          onCommit={commit}
          onHighlight={setHighlight}
          registerRef={registerRef}
        />
      )}
    </div>
  );
};
