import { apiRequest } from "../../api/client";
import type { PlacesAutocompleteResponse } from "./types";

export async function searchPlaces(
  query: string,
  country?: string,
): Promise<PlacesAutocompleteResponse> {
  const params = new URLSearchParams({ q: query });
  if (country) {
    params.set("country", country);
  }
  return apiRequest<PlacesAutocompleteResponse>(`/places/autocomplete/?${params.toString()}`);
}
