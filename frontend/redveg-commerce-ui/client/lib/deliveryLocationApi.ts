import type { DeliveryLocation } from '@/contexts/LocationContext';
import { apiUrl } from '@/lib/api';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const deliveryLocationApi = {
  /**
   * Search for delivery locations by pincode or area name
   * @param query - Search query (pincode or area name)
   * @param serviceableOnly - If true, returns only serviceable locations
   * @returns Promise resolving to array of matching DeliveryLocation objects
   */
  async search(query: string, serviceableOnly = true): Promise<DeliveryLocation[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (serviceableOnly) {
        params.append('serviceableOnly', 'true');
      }
      const apiUrlStr = apiUrl(`delivery-locations/search?${params.toString()}`);
      const response = await fetch(apiUrlStr, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to search delivery locations: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to search delivery locations');
      }
      // Map API response to DeliveryLocation type
      return data.data?.map((loc: any) => ({
        pincode: loc.pincode,
        area: loc.area,
        city: loc.city,
        state: loc.state,
        isServiceable: loc.isServiceable,
        latitude: loc.latitude,
        longitude: loc.longitude
      })) ?? [];
    } catch (error) {
      console.error('Error searching delivery locations:', error);
      throw error; // Re-throw to let caller handle
    }
  },

  /**
   * Reverse geocode latitude/longitude to get location details
   * @param latitude - Latitude coordinate (-90 to 90)
   * @param longitude - Longitude coordinate (-180 to 180)
   * @returns Promise resolving to DeliveryLocation object
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<DeliveryLocation> {
    // Validate input coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    try {
      const apiUrlStr = apiUrl(`delivery-locations/reverse-geocode`);
      const response = await fetch(apiUrlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
        credentials: 'include'
      });

      // Handle HTTP errors
      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = `Failed to reverse geocode location: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse JSON, use the status text
          errorMessage = `Failed to reverse geocode location: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: ApiResponse = await response.json();

      // Handle API-level errors
      if (!data.success) {
        throw new Error(data.message || 'Failed to reverse geocode location');
      }

      // Validate response data
      if (!data.data ||
          typeof data.data.pincode !== 'string' ||
          typeof data.data.area !== 'string' ||
          typeof data.data.city !== 'string' ||
          typeof data.data.state !== 'string' ||
          typeof data.data.isServiceable !== 'boolean' ||
          typeof data.data.latitude !== 'number' ||
          typeof data.data.longitude !== 'number') {
        throw new Error('Invalid response format from reverse geocoding service');
      }

      // Map API response to DeliveryLocation type
      return {
        pincode: data.data.pincode,
        area: data.data.area,
        city: data.data.city,
        state: data.data.state,
        isServiceable: data.data.isServiceable,
        latitude: data.data.latitude,
        longitude: data.data.longitude
      } as DeliveryLocation;
    } catch (error) {
      console.error('Error reverse geocoding location:', error);
      throw error; // Re-throw to let caller handle
    }
  }
};