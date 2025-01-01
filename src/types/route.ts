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

export interface RouteData {
  id?: string;
  title: string;
  locations: Location[];
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 