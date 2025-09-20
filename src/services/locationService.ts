import axios from 'axios';

const GEONAMES_BASE_URL = 'http://api.geonames.org';
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'pk2000';

interface GeoNamesCity {
  geonameId: number;
  name: string;
  countryName: string;
  adminName1: string; // State/Province
  lat: string;
  lng: string;
  population: number;
}

interface LocationSearchResult {
  id: number;
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export class LocationService {
  /**
   * Search for cities by name
   */
  static async searchCities(query: string, maxRows: number = 10): Promise<LocationSearchResult[]> {
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/searchJSON`, {
        params: {
          q: query,
          maxRows,
          username: GEONAMES_USERNAME,
          featureClass: 'P', // Cities, villages, etc.
          orderby: 'population',
          style: 'full'
        }
      });

      if (!response.data.geonames) {
        return [];
      }

      return response.data.geonames.map((city: GeoNamesCity) => ({
        id: city.geonameId,
        name: city.name,
        country: city.countryName,
        state: city.adminName1,
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng),
        displayName: `${city.name}, ${city.adminName1 ? city.adminName1 + ', ' : ''}${city.countryName}`
      }));
    } catch (error) {

      // Return mock data for common cities when GeoNames is not available
      return this.getMockCities(query, maxRows);
    }
  }

  /**
   * Fallback mock cities when GeoNames API is not available
   */
  private static getMockCities(query: string, maxRows: number): LocationSearchResult[] {
    const mockCities = [
      { id: 1, name: 'New York', country: 'United States', state: 'New York', latitude: 40.7128, longitude: -74.0060, displayName: 'New York, New York, United States' },
      { id: 2, name: 'London', country: 'United Kingdom', state: 'England', latitude: 51.5074, longitude: -0.1278, displayName: 'London, England, United Kingdom' },
      { id: 3, name: 'Tokyo', country: 'Japan', state: 'Tokyo', latitude: 35.6762, longitude: 139.6503, displayName: 'Tokyo, Tokyo, Japan' },
      { id: 4, name: 'Paris', country: 'France', state: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, displayName: 'Paris, Île-de-France, France' },
      { id: 5, name: 'Los Angeles', country: 'United States', state: 'California', latitude: 34.0522, longitude: -118.2437, displayName: 'Los Angeles, California, United States' },
      { id: 6, name: 'Sydney', country: 'Australia', state: 'New South Wales', latitude: -33.8688, longitude: 151.2093, displayName: 'Sydney, New South Wales, Australia' },
      { id: 7, name: 'Toronto', country: 'Canada', state: 'Ontario', latitude: 43.6532, longitude: -79.3832, displayName: 'Toronto, Ontario, Canada' },
      { id: 8, name: 'Berlin', country: 'Germany', state: 'Berlin', latitude: 52.5200, longitude: 13.4050, displayName: 'Berlin, Berlin, Germany' },
      { id: 9, name: 'Mumbai', country: 'India', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, displayName: 'Mumbai, Maharashtra, India' },
      { id: 10, name: 'Singapore', country: 'Singapore', state: 'Singapore', latitude: 1.3521, longitude: 103.8198, displayName: 'Singapore, Singapore, Singapore' },
      { id: 11, name: 'Dubai', country: 'United Arab Emirates', state: 'Dubai', latitude: 25.2048, longitude: 55.2708, displayName: 'Dubai, Dubai, United Arab Emirates' },
      { id: 12, name: 'São Paulo', country: 'Brazil', state: 'São Paulo', latitude: -23.5505, longitude: -46.6333, displayName: 'São Paulo, São Paulo, Brazil' },
      { id: 13, name: 'Mexico City', country: 'Mexico', state: 'Mexico City', latitude: 19.4326, longitude: -99.1332, displayName: 'Mexico City, Mexico City, Mexico' },
      { id: 14, name: 'Seoul', country: 'South Korea', state: 'Seoul', latitude: 37.5665, longitude: 126.9780, displayName: 'Seoul, Seoul, South Korea' },
      { id: 15, name: 'Bangkok', country: 'Thailand', state: 'Bangkok', latitude: 13.7563, longitude: 100.5018, displayName: 'Bangkok, Bangkok, Thailand' },
    ];

    const filteredCities = mockCities.filter(city => 
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.country.toLowerCase().includes(query.toLowerCase()) ||
      city.state?.toLowerCase().includes(query.toLowerCase())
    );

    return filteredCities.slice(0, maxRows);
  }

  /**
   * Get city details by coordinates
   */
  static async getCityByCoordinates(lat: number, lng: number): Promise<LocationSearchResult | null> {
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/findNearbyPlaceNameJSON`, {
        params: {
          lat,
          lng,
          username: GEONAMES_USERNAME,
          maxRows: 1
        }
      });

      if (!response.data.geonames || response.data.geonames.length === 0) {
        return null;
      }

      const city = response.data.geonames[0];
      return {
        id: city.geonameId,
        name: city.name,
        country: city.countryName,
        state: city.adminName1,
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng),
        displayName: `${city.name}, ${city.adminName1 ? city.adminName1 + ', ' : ''}${city.countryName}`
      };
    } catch (error) {

      // Return approximate location based on coordinates
      return {
        id: Math.floor(Math.random() * 1000000),
        name: 'Unknown City',
        country: 'Unknown Country',
        latitude: lat,
        longitude: lng,
        displayName: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`
      };
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return Math.round(d * 100) / 100; // Round to 2 decimal places
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}