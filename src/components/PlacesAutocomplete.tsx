import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'e.g., 100ft Road, Indiranagar',
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places services once the API is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        // PlacesService requires a DOM element or map
        const div = document.createElement('div');
        placesService.current = new google.maps.places.PlacesService(div);
        setIsApiReady(true);
        return true;
      }
      return false;
    };

    if (!checkGoogleMaps()) {
      // Poll for API readiness (the script may still be loading)
      const interval = setInterval(() => {
        if (checkGoogleMaps()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!autocompleteService.current || input.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);

      autocompleteService.current.getPlacePredictions(
        {
          input,
          // Bias results to Bengaluru
          locationBias: new google.maps.Circle({
            center: { lat: 12.9716, lng: 77.5946 },
            radius: 30000, // 30km radius covering greater Bengaluru
          }),
          componentRestrictions: { country: 'in' },
          types: ['geocode', 'establishment'],
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      );
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (!isApiReady) return;

    // Debounce the API call
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(val);
    }, 300);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.description);
    setShowDropdown(false);
    setSuggestions([]);

    // Get place details for lat/lng
    if (placesService.current && prediction.place_id) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            onPlaceSelect?.({
              address: place.formatted_address || prediction.description,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="text-stone-900">{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 z-10" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={isApiReady ? placeholder : 'Loading places...'}
        autoComplete="off"
        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
      />
      {isLoading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
      )}

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-stone-200 z-50 overflow-hidden max-h-64 overflow-y-auto"
        >
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-start gap-3 border-b border-stone-50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-stone-600 truncate">
                  {highlightMatch(prediction.structured_formatting.main_text, value)}
                </p>
                <p className="text-xs text-stone-400 truncate mt-0.5">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
            <p className="text-[9px] text-stone-400 flex items-center gap-1">
              <img
                src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png"
                alt="Powered by Google"
                className="h-3"
              />
            </p>
          </div>
        </div>
      )}

      {/* No API fallback message */}
      {!isApiReady && (
        <p className="text-[10px] text-amber-500 mt-1">Google Places loading... You can type manually.</p>
      )}
    </div>
  );
}
