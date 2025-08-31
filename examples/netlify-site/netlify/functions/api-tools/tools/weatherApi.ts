import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Fetches current weather information for a city using Open-Meteo API",
  inputSchema: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "The city name to get weather for (e.g., 'London', 'Tokyo')"
      },
      latitude: {
        type: "number",
        description: "Latitude coordinate (alternative to city name)"
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate (alternative to city name)"
      }
    },
    oneOf: [
      {
        required: ["city"]
      },
      {
        required: ["latitude", "longitude"]
      }
    ]
  }
};

// Simple geocoding for demo purposes (in production, use a proper geocoding service)
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'london': { lat: 51.5074, lon: -0.1278 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'san francisco': { lat: 37.7749, lon: -122.4194 }
};

export const handler: ToolHandler = async (params: { city?: string; latitude?: number; longitude?: number }) => {
  try {
    let lat: number, lon: number;

    if (params.city) {
      const cityKey = params.city.toLowerCase();
      const coords = CITY_COORDS[cityKey];
      
      if (!coords) {
        return {
          success: false,
          error: `City '${params.city}' not found. Available cities: ${Object.keys(CITY_COORDS).join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }
      
      lat = coords.lat;
      lon = coords.lon;
    } else if (params.latitude && params.longitude) {
      lat = params.latitude;
      lon = params.longitude;
    } else {
      throw new Error("Either 'city' or both 'latitude' and 'longitude' must be provided");
    }

    // Call Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API request failed with status: ${response.status}`);
    }

    const data = await response.json() as any;
    const currentWeather = data.current_weather;

    // Map weather codes to descriptions (simplified)
    const weatherDescriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers'
    };

    return {
      success: true,
      location: {
        city: params.city || `${lat}, ${lon}`,
        latitude: lat,
        longitude: lon
      },
      weather: {
        temperature: currentWeather.temperature,
        temperatureUnit: '°C',
        weatherCode: currentWeather.weathercode,
        description: weatherDescriptions[currentWeather.weathercode] || 'Unknown',
        windSpeed: currentWeather.windspeed,
        windDirection: currentWeather.winddirection,
        time: currentWeather.time
      },
      source: "Open-Meteo API",
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      params,
      timestamp: new Date().toISOString()
    };
  }
};