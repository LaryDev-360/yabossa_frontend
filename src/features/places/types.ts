export interface PlaceSuggestion {
  place_id: string;
  label: string;
  formatted_address: string;
  address_line: string | null;
  city: string | null;
  country_code: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface PlacesAutocompleteResponse {
  results: PlaceSuggestion[];
}
