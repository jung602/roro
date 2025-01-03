import { RoutePoint } from './route';

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