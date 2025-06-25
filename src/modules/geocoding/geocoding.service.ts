import { ApiError } from "../../utils/api-error";
import axios from "axios";
import { injectable } from "tsyringe";

@injectable()
export class GeocodingService {
  private readonly nominatimApi = "https://nominatim.openstreetmap.org";

  public async search(query: string) {
    if (!query) {
      throw new ApiError("Search query is required", 400);
    }
    try {
      const response = await axios.get(`${this.nominatimApi}/search`, {
        params: {
          q: query,
          format: "json",
          limit: 1,
        },
        headers: {
          // Penting untuk menyertakan User-Agent
          "User-Agent": "MediNowApp/1.0 (contact@medinow.com)"
        }
      });
      return response.data;
    } catch (error) {
      throw new ApiError("Failed to fetch from geocoding service", 502);
    }
  }

  public async reverse(lat: string, lon: string) {
    if (!lat || !lon) {
      throw new ApiError("Latitude and longitude are required", 400);
    }
    try {
      const response = await axios.get(`${this.nominatimApi}/reverse`, {
        params: {
          lat,
          lon,
          format: "json",
        },
        headers: {
          "User-Agent": "MediNowApp/1.0 (contact@medinow.com)"
        }
      });
      return response.data;
    } catch (error) {
      throw new ApiError("Failed to fetch from geocoding service", 502);
    }
  }
}