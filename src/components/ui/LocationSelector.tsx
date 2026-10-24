"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import locationsData from "@/data/provincias_localidades.json";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, MapPin, X, Search } from "lucide-react";

interface LocationSelectorProps {
  initialProvince?: string;
  initialCity?: string;
  onProvinceChange?: (province: string) => void;
  onCityChange?: (city: string) => void;
  provinceName?: string;
  cityName?: string;
  provinceError?: string;
  cityError?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  layout?: "stacked" | "grid";
}

const rawLocations = locationsData as Record<string, string[]>;
const ALL_PROVINCES = Object.keys(rawLocations).sort((a, b) => a.localeCompare("es"));

function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function LocationSelector({
  initialProvince = "",
  initialCity = "",
  onProvinceChange,
  onCityChange,
  provinceName = "province",
  cityName = "city",
  provinceError,
  cityError,
  disabled = false,
  required = false,
  className = "",
  layout = "stacked",
}: LocationSelectorProps) {
  // Selected official values
  const [selectedProvince, setSelectedProvince] = useState<string>(initialProvince);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);

  // Input text values (user typing)
  const [provinceQuery, setProvinceQuery] = useState<string>(initialProvince);
  const [cityQuery, setCityQuery] = useState<string>(initialCity);

  // Dropdown open states
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  // Keyboard navigation index
  const [highlightedProvinceIdx, setHighlightedProvinceIdx] = useState(-1);
  const [highlightedCityIdx, setHighlightedCityIdx] = useState(-1);

  // Dropdown placement: open "up" if near bottom of screen/container, otherwise "down"
  const [provincePlacement, setProvincePlacement] = useState<"down" | "up">("down");
  const [cityPlacement, setCityPlacement] = useState<"down" | "up">("down");

  // Refs for clicking outside
  const provinceContainerRef = useRef<HTMLDivElement>(null);
  const cityContainerRef = useRef<HTMLDivElement>(null);
  const provinceListRef = useRef<HTMLUListElement>(null);
  const cityListRef = useRef<HTMLUListElement>(null);

  // Detect available space and adjust placement when opening
  useEffect(() => {
    if (isProvinceOpen && provinceContainerRef.current) {
      const rect = provinceContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 210 && spaceAbove > spaceBelow) {
        setProvincePlacement("up");
      } else {
        setProvincePlacement("down");
      }
    }
  }, [isProvinceOpen]);

  useEffect(() => {
    if (isCityOpen && cityContainerRef.current) {
      const rect = cityContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 210 && spaceAbove > spaceBelow) {
        setCityPlacement("up");
      } else {
        setCityPlacement("down");
      }
    }
  }, [isCityOpen]);

  // Sync with initial props if they change
  useEffect(() => {
    setSelectedProvince(initialProvince || "");
    setProvinceQuery(initialProvince || "");
  }, [initialProvince]);

  useEffect(() => {
    setSelectedCity(initialCity || "");
    setCityQuery(initialCity || "");
  }, [initialCity]);

  // Available cities based on selected province
  const availableCities = useMemo(() => {
    if (!selectedProvince || !rawLocations[selectedProvince]) return [];
    return rawLocations[selectedProvince];
  }, [selectedProvince]);

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    const q = normalize(provinceQuery);
    if (!q) return ALL_PROVINCES;
    return ALL_PROVINCES.filter((prov) => normalize(prov).includes(q));
  }, [provinceQuery]);

  // Filtered cities
  const filteredCities = useMemo(() => {
    const q = normalize(cityQuery);
    if (!q) return availableCities;
    return availableCities.filter((c) => normalize(c).includes(q));
  }, [availableCities, cityQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (disabled) {
        setIsProvinceOpen(false);
        setIsCityOpen(false);
        return;
      }

      if (
        provinceContainerRef.current &&
        !provinceContainerRef.current.contains(event.target as Node)
      ) {
        setIsProvinceOpen(false);
        const norm = normalize(provinceQuery);
        const exactMatch = ALL_PROVINCES.find((p) => normalize(p) === norm);
        if (exactMatch && exactMatch !== selectedProvince) {
          handleSelectProvince(exactMatch);
        } else if (!selectedProvince) {
          setProvinceQuery("");
        } else {
          setProvinceQuery(selectedProvince);
        }
      }

      if (
        cityContainerRef.current &&
        !cityContainerRef.current.contains(event.target as Node)
      ) {
        setIsCityOpen(false);
        const norm = normalize(cityQuery);
        const exactMatch = availableCities.find((c) => normalize(c) === norm);
        if (exactMatch && exactMatch !== selectedCity) {
          handleSelectCity(exactMatch);
        } else if (!selectedCity) {
          setCityQuery("");
        } else {
          setCityQuery(selectedCity);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [disabled, provinceQuery, selectedProvince, cityQuery, selectedCity, availableCities]);

  // Selection handlers
  const handleSelectProvince = (prov: string) => {
    if (disabled) return;
    const isDifferent = prov !== selectedProvince;
    setSelectedProvince(prov);
    setProvinceQuery(prov);
    setIsProvinceOpen(false);
    setHighlightedProvinceIdx(-1);

    if (isDifferent) {
      // Only reset city if the province actually changed
      setSelectedCity("");
      setCityQuery("");
      setIsCityOpen(false);

      if (onProvinceChange) onProvinceChange(prov);
      if (onCityChange) onCityChange("");
    } else {
      if (onProvinceChange) onProvinceChange(prov);
    }
  };

  const handleClearProvince = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setSelectedProvince("");
    setProvinceQuery("");
    setSelectedCity("");
    setCityQuery("");
    setIsProvinceOpen(false);
    setIsCityOpen(false);
    if (onProvinceChange) onProvinceChange("");
    if (onCityChange) onCityChange("");
  };

  const handleSelectCity = (c: string) => {
    if (disabled || !selectedProvince) return;
    setSelectedCity(c);
    setCityQuery(c);
    setIsCityOpen(false);
    setHighlightedCityIdx(-1);
    if (onCityChange) onCityChange(c);
  };

  const handleClearCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !selectedProvince) return;
    setSelectedCity("");
    setCityQuery("");
    setIsCityOpen(false);
    if (onCityChange) onCityChange("");
  };

  // Keyboard navigation for Province
  const handleProvinceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isProvinceOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsProvinceOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedProvinceIdx((prev) => {
        const next = prev < filteredProvinces.length - 1 ? prev + 1 : 0;
        scrollItemIntoView(provinceListRef.current, next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedProvinceIdx((prev) => {
        const next = prev > 0 ? prev - 1 : filteredProvinces.length - 1;
        scrollItemIntoView(provinceListRef.current, next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedProvinceIdx >= 0 && filteredProvinces[highlightedProvinceIdx]) {
        handleSelectProvince(filteredProvinces[highlightedProvinceIdx]);
      } else if (filteredProvinces.length > 0) {
        handleSelectProvince(filteredProvinces[0]);
      }
    } else if (e.key === "Escape") {
      setIsProvinceOpen(false);
    }
  };

  // Keyboard navigation for City
  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !selectedProvince) return;
    if (!isCityOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsCityOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCityIdx((prev) => {
        const next = prev < filteredCities.length - 1 ? prev + 1 : 0;
        scrollItemIntoView(cityListRef.current, next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCityIdx((prev) => {
        const next = prev > 0 ? prev - 1 : filteredCities.length - 1;
        scrollItemIntoView(cityListRef.current, next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedCityIdx >= 0 && filteredCities[highlightedCityIdx]) {
        handleSelectCity(filteredCities[highlightedCityIdx]);
      } else if (filteredCities.length > 0) {
        handleSelectCity(filteredCities[0]);
      }
    } else if (e.key === "Escape") {
      setIsCityOpen(false);
    }
  };

  // Internal list scrolling so the modal / page does not jump
  const scrollItemIntoView = (list: HTMLUListElement | null, index: number) => {
    if (!list) return;
    const item = list.children[index] as HTMLElement;
    if (!item) return;

    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const listTop = list.scrollTop;
    const listBottom = listTop + list.clientHeight;

    if (itemTop < listTop) {
      list.scrollTop = itemTop;
    } else if (itemBottom > listBottom) {
      list.scrollTop = itemBottom - list.clientHeight;
    }
  };

  const isCityDisabled = disabled || !selectedProvince;

  return (
    <div className={`${layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-4"} ${className}`}>
      {/* Hidden inputs to integrate with standard HTML form submissions and Next.js server actions */}
      <input type="hidden" name={provinceName} value={selectedProvince} />
      <input type="hidden" name={cityName} value={selectedCity} />

      {/* 1. Selector de Provincia */}
      <div className="space-y-1.5 relative flex-1" ref={provinceContainerRef}>
        <div className="flex items-center justify-between h-5">
          <Label className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 h-5">
            <MapPin size={14} className="text-primary shrink-0" />
            Provincia {required && <span className="text-primary">*</span>}
          </Label>
        </div>

        <div className="relative">
          <Input
            type="text"
            disabled={disabled}
            placeholder="Buscar provincia... (ej: Formosa)"
            value={provinceQuery}
            autoComplete="off"
            onChange={(e) => {
              if (disabled) return;
              setProvinceQuery(e.target.value);
              setIsProvinceOpen(true);
              setHighlightedProvinceIdx(0);
              if (selectedProvince && normalize(e.target.value) !== normalize(selectedProvince)) {
                setSelectedProvince("");
                setSelectedCity("");
                setCityQuery("");
                if (onProvinceChange) onProvinceChange("");
                if (onCityChange) onCityChange("");
              }
            }}
            onFocus={() => {
              if (!disabled) {
                setIsProvinceOpen(true);
                setIsCityOpen(false);
              }
            }}
            onKeyDown={handleProvinceKeyDown}
            className={`bg-black/40 border border-white/10 text-white focus:border-primary/50 pr-16 h-10 transition-all text-sm rounded-md placeholder:text-zinc-600 ${
              provinceError ? "border-red-500 ring-1 ring-red-500/30" : ""
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedProvince && !disabled && (
              <button
                type="button"
                onClick={handleClearProvince}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Limpiar provincia"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) setIsProvinceOpen((prev) => !prev);
              }}
              className="text-zinc-400 hover:text-primary p-1 transition-transform"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isProvinceOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {provinceError && <p className="text-xs text-red-500 mt-1">{provinceError}</p>}

        {/* Dropdown list for Province */}
        {isProvinceOpen && !disabled && (
          <div
            className={`absolute z-50 left-0 right-0 ${
              provincePlacement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } bg-zinc-950/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          >
            <ul
              ref={provinceListRef}
              className="max-h-[188px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 divide-y divide-white/5"
            >
              {filteredProvinces.length === 0 ? (
                <li className="h-10 px-3 text-xs text-zinc-400 text-center flex items-center justify-center gap-1.5">
                  <Search size={13} className="text-zinc-500" />
                  No se encontró ninguna provincia
                </li>
              ) : (
                filteredProvinces.map((prov, idx) => {
                  const isSelected = selectedProvince === prov;
                  const isHighlighted = highlightedProvinceIdx === idx;
                  return (
                    <li
                      key={prov}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectProvince(prov);
                      }}
                      onMouseEnter={() => setHighlightedProvinceIdx(idx)}
                      className={`h-9 px-3 text-sm cursor-pointer flex items-center justify-between shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary/15 text-primary font-semibold"
                          : isHighlighted
                          ? "bg-white/10 text-white"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{prov}</span>
                      {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Selector de Localidad */}
      <div className="space-y-1.5 relative flex-1" ref={cityContainerRef}>
        <div className="flex items-center justify-between h-5">
          <Label
            className={`text-xs font-medium flex items-center gap-1.5 h-5 ${
              isCityDisabled ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            <MapPin size={14} className={isCityDisabled ? "text-zinc-600" : "text-primary shrink-0"} />
            Localidad {required && <span className="text-primary">*</span>}
          </Label>
        </div>

        <div className="relative">
          <Input
            type="text"
            disabled={isCityDisabled}
            placeholder={
              !selectedProvince
                ? "Primero provincia..."
                : `Buscar en ${selectedProvince}...`
            }
            value={cityQuery}
            autoComplete="off"
            onChange={(e) => {
              if (isCityDisabled) return;
              setCityQuery(e.target.value);
              setIsCityOpen(true);
              setHighlightedCityIdx(0);
              if (selectedCity && normalize(e.target.value) !== normalize(selectedCity)) {
                setSelectedCity("");
                if (onCityChange) onCityChange("");
              }
            }}
            onFocus={() => {
              if (!isCityDisabled) {
                setIsCityOpen(true);
                setIsProvinceOpen(false);
              }
            }}
            onKeyDown={handleCityKeyDown}
            className={`bg-black/40 border border-white/10 text-white focus:border-primary/50 pr-16 h-10 transition-all text-sm rounded-md placeholder:text-zinc-600 ${
              cityError ? "border-red-500 ring-1 ring-red-500/30" : ""
            } ${isCityDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedCity && !isCityDisabled && (
              <button
                type="button"
                onClick={handleClearCity}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Limpiar localidad"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              disabled={isCityDisabled}
              onClick={() => {
                if (!isCityDisabled) setIsCityOpen((prev) => !prev);
              }}
              className="text-zinc-400 hover:text-primary p-1 transition-transform"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isCityOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {cityError && <p className="text-xs text-red-500 mt-1">{cityError}</p>}

        {/* Dropdown list for City */}
        {isCityOpen && !isCityDisabled && (
          <div
            className={`absolute z-50 left-0 right-0 ${
              cityPlacement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } bg-zinc-950/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          >
            <ul
              ref={cityListRef}
              className="max-h-[188px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 divide-y divide-white/5"
            >
              {filteredCities.length === 0 ? (
                <li className="h-10 px-3 text-xs text-zinc-400 text-center flex items-center justify-center gap-1.5">
                  <Search size={13} className="text-zinc-500" />
                  No se encontró ninguna localidad en {selectedProvince}
                </li>
              ) : (
                filteredCities.map((city, idx) => {
                  const isSelected = selectedCity === city;
                  const isHighlighted = highlightedCityIdx === idx;
                  return (
                    <li
                      key={city}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectCity(city);
                      }}
                      onMouseEnter={() => setHighlightedCityIdx(idx)}
                      className={`h-9 px-3 text-sm cursor-pointer flex items-center justify-between shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary/15 text-primary font-semibold"
                          : isHighlighted
                          ? "bg-white/10 text-white"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{city}</span>
                      {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
