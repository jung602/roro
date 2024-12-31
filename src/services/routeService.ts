import { collection, addDoc, getDocs, doc, getDoc, query, orderBy, serverTimestamp, Timestamp, where, limit, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Route, SavedRoute } from '../types/map';

const ROUTES_COLLECTION = 'routes';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 메모리 캐시 구현
const cache = new Map<string, { data: any; timestamp: number }>();

const getFromCache = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// 사용자 정보 캐시
const userCache = new Map<string, { data: any; timestamp: number }>();

const getUserData = async (userId: string) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  userCache.set(userId, { data: userData, timestamp: Date.now() });
  return userData;
};

const serializeRoute = async (route: Route, userId: string) => {
  const { id, title, points, duration, distance } = route;
  console.log('저장할 포인트들:', points);

  // 사용자 정보 가져오기
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();

  return {
    title,
    points: points.map((point, index) => ({
      id: point.id || `point-${index}`,
      name: point.name || `위치 ${index + 1}`,
      lat: Number(point.lat),
      lng: Number(point.lng),
      order: index,
      images: point.images || [],
    })),
    duration: duration || 0,
    distance: distance || 0,
    created: serverTimestamp(),
    updated: serverTimestamp(),
    userId,
    userNickname: userData?.nickname || '익명',
    userProfileImage: userData?.profileImageUrl || null,
  };
};

export const saveRoute = async (route: Route, userId: string): Promise<string> => {
  try {
    console.log('Firestore에 저장 시도:', route);
    console.log('선택된 장소 수:', route.points.length);
    
    const routeData = await serializeRoute(route, userId);
    console.log('변환된 데이터:', routeData);
    console.log('변환된 포인트 수:', routeData.points.length);
    
    const docRef = await addDoc(collection(db, ROUTES_COLLECTION), routeData);
    console.log('Firestore 저장 성공! Document ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore 저장 에러:', error);
    throw error;
  }
};

export const getRoutes = async (pageSize: number = 10): Promise<SavedRoute[]> => {
  try {
    const cacheKey = `routes_${pageSize}`;
    const cachedRoutes = getFromCache(cacheKey);
    if (cachedRoutes) {
      return cachedRoutes;
    }

    const q = query(
      collection(db, ROUTES_COLLECTION),
      orderBy('created', 'desc'),
      limit(pageSize)
    );
    const querySnapshot = await getDocs(q);
    
    // 사용자 정보를 한 번에 가져오기
    const userIds = new Set(querySnapshot.docs.map(doc => doc.data().userId));
    const userDataPromises = Array.from(userIds).map(userId => getUserData(userId));
    const userData = await Promise.all(userDataPromises);
    
    const userDataMap = new Map();
    Array.from(userIds).forEach((userId, index) => {
      userDataMap.set(userId, userData[index]);
    });

    const routes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const user = userDataMap.get(data.userId);
      
      return {
        id: doc.id,
        title: data.title,
        points: data.points
          .sort((a: any, b: any) => a.order - b.order)
          .map((point: any) => ({
            id: point.id,
            name: point.name,
            lat: Number(point.lat),
            lng: Number(point.lng),
            images: point.images || [],
          })),
        duration: Number(data.duration),
        distance: Number(data.distance),
        created: data.created instanceof Timestamp ? data.created.toDate() : new Date(),
        updated: data.updated instanceof Timestamp ? data.updated.toDate() : new Date(),
        userId: data.userId,
        userNickname: user?.nickname || '익명',
        userProfileImage: user?.profileImageUrl || null,
      } as SavedRoute;
    });

    setCache(cacheKey, routes);
    return routes;
  } catch (error) {
    console.error('Firestore 조회 에러:', error);
    throw error;
  }
};

export const getRouteById = async (id: string): Promise<SavedRoute | null> => {
  try {
    const cacheKey = `route_${id}`;
    const cachedRoute = getFromCache(cacheKey);
    if (cachedRoute) {
      return cachedRoute;
    }

    const docRef = doc(db, ROUTES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Raw route data from Firestore:', data);
      const userData = data.userId ? await getUserData(data.userId) : null;
      
      const route = {
        id: docSnap.id,
        title: data.title,
        points: data.points
          .sort((a: any, b: any) => a.order - b.order)
          .map((point: any) => ({
            id: point.id,
            name: point.name,
            lat: Number(point.lat),
            lng: Number(point.lng),
            images: point.images || [],
          })),
        duration: Number(data.duration),
        distance: Number(data.distance),
        created: data.created instanceof Timestamp ? data.created.toDate() : new Date(),
        updated: data.updated instanceof Timestamp ? data.updated.toDate() : new Date(),
        userId: data.userId,
        userNickname: userData?.nickname || '익명',
        userProfileImage: userData?.profileImageUrl || null,
      } as SavedRoute;

      console.log('Processed route with images:', route);
      setCache(cacheKey, route);
      return route;
    }
    return null;
  } catch (error) {
    console.error('Firestore 단일 경로 조회 에러:', error);
    throw error;
  }
};

export const updateRoute = async (route: Route, userId: string): Promise<void> => {
  try {
    const routeRef = doc(db, ROUTES_COLLECTION, route.id);
    const routeDoc = await getDoc(routeRef);
    
    if (!routeDoc.exists()) {
      throw new Error('Route not found');
    }

    const data = routeDoc.data();
    if (data.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const routeData = {
      points: route.points.map((point, index) => ({
        id: point.id || `point-${index}`,
        name: point.name || `위치 ${index + 1}`,
        lat: Number(point.lat),
        lng: Number(point.lng),
        order: index,
        images: point.images || [],
      })),
      updated: serverTimestamp(),
    };

    await updateDoc(routeRef, routeData);
    
    // 캐시 무효화
    const cacheKeys = Array.from(cache.keys());
    cacheKeys.forEach(key => {
      if (key.includes('routes_') || key === `route_${route.id}`) {
        cache.delete(key);
      }
    });
  } catch (error) {
    console.error('Route update error:', error);
    throw error;
  }
}; 