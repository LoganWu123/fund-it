/**
 * Orange County geography used by the geographic eligibility tests.
 * City names are public geography, not parcel facts. No ZIP codes or addresses
 * are used: the prototype never invents an address.
 */
export const OC_CITIES = [
  "Aliso Viejo",
  "Anaheim",
  "Brea",
  "Buena Park",
  "Costa Mesa",
  "Cypress",
  "Dana Point",
  "Fountain Valley",
  "Fullerton",
  "Garden Grove",
  "Huntington Beach",
  "Irvine",
  "La Habra",
  "La Palma",
  "Laguna Beach",
  "Laguna Hills",
  "Laguna Niguel",
  "Laguna Woods",
  "Lake Forest",
  "Los Alamitos",
  "Mission Viejo",
  "Newport Beach",
  "Orange",
  "Placentia",
  "Rancho Santa Margarita",
  "San Clemente",
  "San Juan Capistrano",
  "Santa Ana",
  "Seal Beach",
  "Stanton",
  "Tustin",
  "Villa Park",
  "Westminster",
  "Yorba Linda",
] as const;

export type OCCity = (typeof OC_CITIES)[number];

export function isOCCity(value: string): value is OCCity {
  return (OC_CITIES as readonly string[]).includes(value);
}
