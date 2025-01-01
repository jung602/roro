export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RoutePoint extends LatLng {
  id: string;
  name?: string;
}

export interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
  images?: { url: string; path: string; }[];
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Route {
  id: string;
  title: string;
  points: Point[];
  created?: Date;
  updated?: Date;
  duration?: number;
  distance?: number;
  path3D?: Vector3D[];
}

export interface MapViewport {
  center: LatLng;
  zoom: number;
  bounds?: MapBounds;
}

export interface SavedRoute extends Route {
  created: Date;
  updated: Date;
  userId: string;
  userNickname?: string;
  userProfileImage?: string | null;
} 