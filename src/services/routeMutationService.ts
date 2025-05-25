import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RouteData, RoutePoint } from '@/types/route';
import { handleError } from '@/utils/errorHandler';

/**
 * 새 경로 생성
 */
export const createRoute = async (routeData: RouteData): Promise<string> => {
  try {
    // 경로 기본 정보 저장
    const routeRef = await addDoc(collection(db, 'routes'), {
      title: routeData.title,
      userId: routeData.userId || null,
      created: serverTimestamp(),
      updated: serverTimestamp()
    });

    // 포인트 데이터 저장
    if (routeData.points && routeData.points.length > 0) {
      const batch = writeBatch(db);
      
      routeData.points.forEach((point, index) => {
        const pointRef = doc(collection(db, 'routes', routeRef.id, 'points'));
        batch.set(pointRef, {
          name: String(index + 1),  // 포인트 번호를 이름으로 사용
          lat: point.lat,
          lng: point.lng,
          images: point.images || []
        });
      });
      
      await batch.commit();
    }

    return routeRef.id;
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('경로 생성 실패:', errorDetails.message);
    throw error;
  }
};

/**
 * 경로 업데이트
 */
export const updateRoute = async (routeId: string, routeData: Partial<RouteData>): Promise<void> => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    
    // 기본 경로 정보 업데이트
    await updateDoc(routeRef, {
      ...(routeData.title && { title: routeData.title }),
      updated: serverTimestamp()
    });
    
    // 포인트 데이터 업데이트 (전체 교체)
    if (routeData.points && routeData.points.length > 0) {
      // 기존 포인트 컬렉션 삭제 후 새로 생성
      const pointsCollection = collection(db, 'routes', routeId, 'points');
      const batch = writeBatch(db);
      
      // 새 포인트 추가
      routeData.points.forEach((point, index) => {
        const pointRef = doc(collection(db, 'routes', routeId, 'points'));
        batch.set(pointRef, {
          name: String(index + 1),
          lat: point.lat,
          lng: point.lng,
          images: point.images || []
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('경로 업데이트 실패:', errorDetails.message);
    throw error;
  }
};

/**
 * 경로 삭제
 */
export const deleteRoute = async (routeId: string): Promise<void> => {
  try {
    // 경로 문서 삭제
    await deleteDoc(doc(db, 'routes', routeId));
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('경로 삭제 실패:', errorDetails.message);
    throw error;
  }
};

/**
 * 경로 포인트에 이미지 추가
 */
export const addImageToRoutePoint = async (
  routeId: string, 
  pointId: string, 
  imageUrl: string, 
  imagePath: string
): Promise<void> => {
  try {
    const pointRef = doc(db, 'routes', routeId, 'points', pointId);
    
    await updateDoc(pointRef, {
      images: Array(imageUrl, imagePath)
    });
  } catch (error) {
    const errorDetails = handleError(error, 'route');
    console.error('포인트 이미지 추가 실패:', errorDetails.message);
    throw error;
  }
}; 