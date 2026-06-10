export interface WorldCup2026Venue {
  venueSlug: string;
  fifaVenueLabel: string;
  hostCity: string;
  hostCountry: "Canada" | "Mexico" | "United States";
  status: "host-city-confirmed" | "manual-verification-needed";
  sourceLabel: string;
}

export const worldCup2026Venues: WorldCup2026Venue[] = [
  ["atlanta", "Atlanta Stadium", "Atlanta", "United States"],
  ["boston", "Boston Stadium", "Boston", "United States"],
  ["dallas", "Dallas Stadium", "Dallas", "United States"],
  ["guadalajara", "Guadalajara Stadium", "Guadalajara", "Mexico"],
  ["houston", "Houston Stadium", "Houston", "United States"],
  ["kansas-city", "Kansas City Stadium", "Kansas City", "United States"],
  ["los-angeles", "Los Angeles Stadium", "Los Angeles", "United States"],
  ["mexico-city", "Mexico City Stadium", "Mexico City", "Mexico"],
  ["miami", "Miami Stadium", "Miami", "United States"],
  ["monterrey", "Monterrey Stadium", "Monterrey", "Mexico"],
  ["new-york-new-jersey", "New York New Jersey Stadium", "East Rutherford", "United States"],
  ["philadelphia", "Philadelphia Stadium", "Philadelphia", "United States"],
  ["san-francisco-bay-area", "San Francisco Bay Area Stadium", "Santa Clara", "United States"],
  ["seattle", "Seattle Stadium", "Seattle", "United States"],
  ["toronto", "Toronto Stadium", "Toronto", "Canada"],
  ["vancouver", "Vancouver Stadium", "Vancouver", "Canada"],
].map(([venueSlug, fifaVenueLabel, hostCity, hostCountry]) => ({
  venueSlug,
  fifaVenueLabel,
  hostCity,
  hostCountry: hostCountry as WorldCup2026Venue["hostCountry"],
  status: "host-city-confirmed",
  sourceLabel: "FIFA public host city/stadium label",
}));
