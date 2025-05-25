import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SavedRoute, RoutePoint } from '@/types/route';
import { handleError } from '@/utils/errorHandler';

/**
 * 모든 경로 조회
 */
export const getRoutes = async (): Promise<SavedRoute[]> => {
  try {
    const routesCollection = collection(db, 'routes');
    const q = query(routesCollection, orderBy('created', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const routes: SavedRoute[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const routeData = docSnapshot.data();
      
      // 포인트 데이터 가져오기
      const pointsCollection = collection(db, 'routes', docSnapshot.id, 'points');
      const pointsSnapshot = await getDocs(pointsCollection);
      const points: RoutePoint[] = pointsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RoutePoint));
      
      // 포인트를 이름(숫자)으로 정렬
      const sortedPoints = points.sort((a, b) => {
        const aNum = parseInt(a.name) || 0;
        const bNum = parseInt(b.name) || 0;
        return aNum - bNum;
      });
      
      // 사용자 정보 가져오기
      let userNickname = '익명';
      let userProfileImage = null;
      
      if (routeData.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', routeData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userNickname = userData.nickname || '익명';
            userProfileImage = userData.profileImageUrl || null;
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
        }
      }
      
      routes.push({
        id: docSnapshot.id,
        title: routeData.title,
        points: sortedPoints,
        created: routeData.created.toDate(),
        updated: routeData.updated.toDate(),
        userId: routeData.userId,
        userNickname,
        userProfileImage
      });
    }
    
    return routes;
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('경로 조회 실패:', errorDetails.message);
    throw error;
  }
};

/**
 * 사용자별 경로 조회
 */
export const getUserRoutes = async (userId: string): Promise<SavedRoute[]> => {
  try {
    console.log('getUserRoutes called with userId:', userId);
    
    const routesCollection = collection(db, 'routes');
    const q = query(
      routesCollection,
      where('userId', '==', userId)
      // orderBy 제거 - 복합 인덱스 문제 해결을 위해 클라이언트에서 정렬
    );
    const querySnapshot = await getDocs(q);
    
    console.log('Found routes:', querySnapshot.size);
    
    const routes: SavedRoute[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const routeData = docSnapshot.data();
      console.log('Processing route:', docSnapshot.id, routeData);
      
      // 포인트 데이터 가져오기
      const pointsCollection = collection(db, 'routes', docSnapshot.id, 'points');
      const pointsSnapshot = await getDocs(pointsCollection);
      console.log('Found points for route', docSnapshot.id, ':', pointsSnapshot.size);
      
      const points: RoutePoint[] = pointsSnapshot.docs.map(doc => {
        const pointData = doc.data();
        console.log('Point data:', pointData);
        return {
          id: doc.id,
          ...pointData
        } as RoutePoint;
      });
      
      // 포인트를 이름(숫자)으로 정렬
      const sortedPoints = points.sort((a, b) => {
        const aNum = parseInt(a.name) || 0;
        const bNum = parseInt(b.name) || 0;
        return aNum - bNum;
      });
      
      console.log('Sorted points:', sortedPoints);
      
      // 사용자 정보 가져오기
      let userNickname = '익명';
      let userProfileImage = null;
      
      if (routeData.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', routeData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userNickname = userData.nickname || '익명';
            userProfileImage = userData.profileImageUrl || null;
            console.log('User data found:', { userNickname, userProfileImage });
          } else {
            console.log('User document not found for userId:', routeData.userId);
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
        }
      }
      
      const route: SavedRoute = {
        id: docSnapshot.id,
        title: routeData.title,
        points: sortedPoints,
        created: routeData.created.toDate(),
        updated: routeData.updated.toDate(),
        userId: routeData.userId,
        userNickname,
        userProfileImage
      };
      
      console.log('Processed route:', route);
      routes.push(route);
    }
    
    // 클라이언트에서 날짜 기준으로 정렬 (최신순)
    const sortedRoutes = routes.sort((a, b) => b.created.getTime() - a.created.getTime());
    
    console.log('Final routes array:', sortedRoutes);
    return sortedRoutes;
  } catch (error) {
    console.error('getUserRoutes error:', error);
    const errorDetails = handleError(error, 'route');
    console.error('사용자 경로 조회 실패:', errorDetails.message);
    throw error;
  }
};

/**
 * 특정 경로 조회
 */
export const getRouteById = async (routeId: string): Promise<SavedRoute | null> => {
  try {
    const routeDoc = await getDoc(doc(db, 'routes', routeId));
    
    if (!routeDoc.exists()) {
      return null;
    }
    
    const routeData = routeDoc.data();
    
    // 포인트 데이터 가져오기
    const pointsCollection = collection(db, 'routes', routeId, 'points');
    const pointsSnapshot = await getDocs(pointsCollection);
    const points: RoutePoint[] = pointsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RoutePoint));
    
    // 포인트를 이름(숫자)으로 정렬
    const sortedPoints = points.sort((a, b) => {
      const aNum = parseInt(a.name) || 0;
      const bNum = parseInt(b.name) || 0;
      return aNum - bNum;
    });
    
    // 사용자 정보 가져오기
    let userNickname = '익명';
    let userProfileImage = null;
    
    if (routeData.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', routeData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userNickname = userData.nickname || '익명';
          userProfileImage = userData.profileImageUrl || null;
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    }
    
    return {
      id: routeId,
      title: routeData.title,
      points: sortedPoints,
      created: routeData.created.toDate(),
      updated: routeData.updated.toDate(),
      userId: routeData.userId,
      userNickname,
      userProfileImage
    };
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('경로 조회 실패:', errorDetails.message);
    throw error;
  }
}; 