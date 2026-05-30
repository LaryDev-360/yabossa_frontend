import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import { searchPlaces } from "../api";
import type { PlaceSuggestion } from "../types";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";

interface AddressAutocompleteProps {
  address: string;
  city: string;
  formattedAddress: string;
  disabled?: boolean;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSelect: (suggestion: PlaceSuggestion) => void;
  onManualModeChange?: (manual: boolean) => void;
}

export default function AddressAutocomplete({
  address,
  city,
  formattedAddress,
  disabled = false,
  onAddressChange,
  onCityChange,
  onSelect,
  onManualModeChange,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [manualMode, setManualMode] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (formattedAddress) {
      setQuery(formattedAddress);
    } else if (address) {
      setQuery(address);
    } else {
      setQuery("");
    }
  }, [formattedAddress, address]);

  const runSearch = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await searchPlaces(trimmed);
        setResults(res.results);
        setIsOpen(res.results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        setResults([]);
        setIsOpen(false);
        setError(err instanceof ApiError ? err.message : t("places.searchError"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (manualMode || disabled) {
      return;
    }
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, manualMode, disabled, runSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchToManual() {
    setManualMode(true);
    setIsOpen(false);
    setResults([]);
    onManualModeChange?.(true);
  }

  function switchToSearch() {
    setManualMode(false);
    onManualModeChange?.(false);
  }

  function pickSuggestion(suggestion: PlaceSuggestion) {
    setQuery(suggestion.formatted_address);
    setIsOpen(false);
    setResults([]);
    onSelect(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Label>{t("locations.address")}</Label>
          {manualMode ? (
            <button
              type="button"
              onClick={switchToSearch}
              className="text-xs font-medium text-brand-500 hover:text-brand-600"
              disabled={disabled}
            >
              {t("places.useSearch")}
            </button>
          ) : (
            <button
              type="button"
              onClick={switchToManual}
              className="text-xs font-medium text-brand-500 hover:text-brand-600"
              disabled={disabled}
            >
              {t("places.enterManually")}
            </button>
          )}
        </div>

        {manualMode ? (
          <TextArea
            value={address}
            onChange={onAddressChange}
            disabled={disabled}
            rows={2}
            placeholder={t("places.addressPlaceholder")}
          />
        ) : (
          <div ref={containerRef} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={t("places.searchPlaceholder")}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            />
            {isLoading && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t("places.searching")}</p>
            )}
            {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
            {!isLoading && !error && query.trim().length >= 3 && results.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t("places.noResults")}</p>
            )}
            {isOpen && results.length > 0 && (
              <ul
                id={listId}
                role="listbox"
                className="absolute z-50 w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-theme-sm dark:bg-gray-900 dark:border-gray-700"
              >
                {results.map((item, index) => (
                  <li key={item.place_id} role="option" aria-selected={index === activeIndex}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${
                        index === activeIndex ? "bg-gray-50 dark:bg-white/5" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>{t("locations.city")}</Label>
        <Input
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled}
          placeholder={t("places.cityPlaceholder")}
        />
      </div>
    </div>
  );
}
