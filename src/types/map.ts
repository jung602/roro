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
}

export interface Route {
  id: string;
  title: string;
  points: Point[];
  created?: Date;
  updated?: Date;
  duration?: number;
  distance?: number;
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