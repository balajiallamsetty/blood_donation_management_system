# Frontend

This Vite + React app powers the donor, hospital, and admin experiences for the blood donation system.

## Getting Started

1. Install dependencies:
	```bash
	npm install
	```
2. Copy `.env.example` to `.env` and fill in the required values (see below).
3. Start the dev server:
	```bash
	npm run dev
	```

## Google Maps Autocomplete

Donor profile editing now uses Google Maps Places Autocomplete and reverse geocoding. Create a Google Maps API key with both the **Places API** and **Geocoding API** enabled, then expose it to Vite via `.env`:

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Restart the dev server after updating the env file. When the key is missing or the script fails to load, the profile form automatically falls back to manual latitude/longitude entry.

- Allow the site to access your browser location when prompted so donors can capture their current position without typing coordinates. A fallback manual mode remains available.
