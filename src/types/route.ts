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

export interface Route {
  id: string;
  title: string;
  points: RoutePoint[];
  duration?: number;
  distance?: number;
  path3D?: any[];
}

export interface SavedRoute extends Route {
  created: Date;
  updated: Date;
  userId: string;
  userNickname: string;
  userProfileImage: string | null;
} 