export interface Location {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  images?: LocationImage[];
}

export interface LocationImage {
  url: string;
  path: string;
}

export interface RoutePoint {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  images?: LocationImage[];
}

export interface RouteData {
  id?: string;
  title: string;
  locations: Location[];
  points?: RoutePoint[];
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 