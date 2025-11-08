import React, { useEffect, useMemo, useRef, useState } from "react";
import Input from "./Input";
import Button from "./Button";
import "./styles/LocationAutocomplete.css";

const scriptId = "google-maps-places";
const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const loadGoogleMapsScript = (key) => {
  if (typeof window === "undefined") return Promise.reject(new Error("Window not available"));

  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    if (existingScript.dataset.loaded === "true" && window.google?.maps?.places) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
        existingScript.dataset.loaded = "true";
        resolve();
      };
      const handleError = () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
        reject(new Error("Google Maps script failed to load"));
      };
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = (err) => {
      script.remove();
      reject(err);
    };
    document.head.appendChild(script);
  });
};

const getDisplayValue = (location) => {
  if (!location) return "";
  if (location.label) return location.label;
  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  }
  return "";
};

const LocationAutocomplete = ({ value, onChange, disabled = false }) => {
  const [mode, setMode] = useState("auto");
  const [scriptStatus, setScriptStatus] = useState("idle"); // idle | loading | ready | error | missing
  const [inputValue, setInputValue] = useState(getDisplayValue(value));
  const [manualFields, setManualFields] = useState({
    lat: value?.lat != null ? String(value.lat) : "",
    lng: value?.lng != null ? String(value.lng) : "",
    label: value?.label || "",
  });
  const [manualError, setManualError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const listenerRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    setInputValue(getDisplayValue(value));
    setManualFields({
      lat: value?.lat != null ? String(value.lat) : "",
      lng: value?.lng != null ? String(value.lng) : "",
      label: value?.label || "",
    });
  }, [value]);

  const geolocationSupported = useMemo(
    () => typeof navigator !== "undefined" && Boolean(navigator.geolocation),
    []
  );
  const autoAvailable = useMemo(() => scriptStatus === "ready", [scriptStatus]);

  useEffect(() => {
    if (!googleApiKey) {
      setScriptStatus("missing");
      setMode("manual");
      return;
    }

    let cancelled = false;
    const ensureScript = async () => {
      try {
        setScriptStatus("loading");
        await loadGoogleMapsScript(googleApiKey);
        if (cancelled) return;
        setScriptStatus("ready");
      } catch (err) {
        console.error("Failed to load Google Maps", err);
        if (cancelled) return;
        setScriptStatus("error");
        setMode("manual");
      }
    };

    if (!window.google?.maps?.places) {
      ensureScript();
    } else {
      setScriptStatus("ready");
    }

    return () => {
      cancelled = true;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (scriptStatus !== "ready" || mode !== "auto") return;
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });

    listenerRef.current = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      const geometry = place.geometry;
      const location = geometry?.location;
      if (!location) {
        setManualError("Selected place does not have location data.");
        return;
      }
      const lat = location.lat();
      const lng = location.lng();
      const label = place.formatted_address || place.name || "";
      const next = { lat, lng, label };
      setInputValue(label || `${lat}, ${lng}`);
      setManualFields({ lat: String(lat), lng: String(lng), label });
      setManualError("");
      onChange?.(next);
    });

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [mode, onChange, scriptStatus]);

  useEffect(() => {
    if (scriptStatus === "ready" && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [scriptStatus]);

  const handleManualField = (field, val) => {
    setManualFields((prev) => ({ ...prev, [field]: val }));
  };

  const handleUseCurrentLocation = () => {
    if (!geolocationSupported || typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const applyLocation = (labelText) => {
          const label = labelText?.trim() || "Current location";
          const next = label ? { lat, lng, label } : { lat, lng };
          setInputValue(getDisplayValue(next));
          setManualFields({ lat: String(lat), lng: String(lng), label });
          setManualError("");
          setGeoError("");
          setIsLocating(false);
          setMode((prev) => (autoAvailable ? "auto" : prev));
          onChange?.(next);
        };

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && Array.isArray(results) && results.length > 0) {
              applyLocation(results[0].formatted_address || "Current location");
            } else {
              applyLocation("Current location");
            }
          });
        } else {
          applyLocation("Current location");
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        setGeoError("Unable to fetch your current location. Check permissions and try again.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyManualLocation = () => {
    const lat = manualFields.lat.trim() === "" ? NaN : Number(manualFields.lat);
    const lng = manualFields.lng.trim() === "" ? NaN : Number(manualFields.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setManualError("Please provide valid latitude and longitude.");
      onChange?.(null);
      return;
    }

    const label = manualFields.label.trim();
    const next = { lat, lng };
    if (label) next.label = label;

    setManualError("");
    setGeoError("");
    setInputValue(getDisplayValue(next));
    onChange?.(next);
  };

  const clearLocation = () => {
    setInputValue("");
    setManualFields({ lat: "", lng: "", label: "" });
    setManualError("");
    setGeoError("");
    onChange?.(null);
  };

  const showManualToggle = autoAvailable && mode === "auto";
  const showAutoToggle = autoAvailable && mode === "manual";

  return (
    <div className="location-field">
      <label className="location-label">Location</label>

      {geolocationSupported && (
        <div className="location-toolbar">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleUseCurrentLocation}
            disabled={disabled || isLocating}
          >
            {isLocating ? "Locating..." : "Use Current Location"}
          </Button>
          {isLocating && <span className="location-status">Fetching your location…</span>}
        </div>
      )}

      {geoError && <p className="location-error">{geoError}</p>}

      {mode === "auto" ? (
        <>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setInputValue(nextValue);
              if (nextValue.trim() === "") {
                onChange?.(null);
              }
            }}
            placeholder={
              scriptStatus === "loading"
                ? "Loading Google suggestions..."
                : "Search for a location"
            }
            disabled={disabled || scriptStatus !== "ready"}
            autoComplete="off"
          />
          {scriptStatus === "loading" && (
            <p className="location-helper">Loading Google Maps…</p>
          )}
          {scriptStatus === "ready" && (
            <p className="location-helper">Start typing to choose a location via Google Maps.</p>
          )}
          {scriptStatus === "error" && (
            <p className="location-error">
              Google Maps failed to load. Switch to manual entry below.
            </p>
          )}
          {scriptStatus === "missing" && (
            <p className="location-error">
              Google Maps API key not configured. Use manual entry instead.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="manual-grid">
            <div>
              <label>Latitude</label>
              <Input
                type="number"
                value={manualFields.lat}
                onChange={(event) => handleManualField("lat", event.target.value)}
                step="0.000001"
                placeholder="e.g., 16.3067"
                disabled={disabled}
              />
            </div>
            <div>
              <label>Longitude</label>
              <Input
                type="number"
                value={manualFields.lng}
                onChange={(event) => handleManualField("lng", event.target.value)}
                step="0.000001"
                placeholder="e.g., 80.4365"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="manual-label">
            <label>Location Label (optional)</label>
            <Input
              value={manualFields.label}
              onChange={(event) => handleManualField("label", event.target.value)}
              placeholder="Hospital Road, Guntur"
              disabled={disabled}
            />
          </div>
          {manualError && <p className="location-error">{manualError}</p>}
          <div className="location-actions">
            <Button type="button" size="sm" onClick={applyManualLocation} disabled={disabled}>
              Apply Coordinates
            </Button>
            {autoAvailable && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMode("auto");
                  setManualError("");
                }}
              >
                Use Map Search
              </Button>
            )}
          </div>
        </>
      )}

      {value && (value.lat != null || value.lng != null) && (
        <div className="location-selected">
          <span>
            {value.label || "Coordinates"}: {" "}
            {typeof value.lat === "number" && typeof value.lng === "number"
              ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
              : "--"}
          </span>
          <button type="button" className="link-button" onClick={clearLocation} disabled={disabled}>
            Clear
          </button>
        </div>
      )}

      {showManualToggle && (
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode("manual");
            setManualError("");
          }}
        >
          Enter coordinates manually
        </button>
      )}

      {showAutoToggle && (
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode("auto");
            setManualError("");
          }}
        >
          Use map search
        </button>
      )}
    </div>
  );
};

export default LocationAutocomplete;
