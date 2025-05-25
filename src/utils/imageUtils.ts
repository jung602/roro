import EXIF from 'exif-js';

interface ImageMetadata {
  lat?: number;
  lng?: number;
  timestamp?: Date;
  originalFile: File;
  previewUrl: string;
}

/**
 * GPS 정보를 십진수 좌표로 변환
 */
const convertDMSToDD = (degrees: number, minutes: number, seconds: number, direction: string): number => {
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = -dd;
  }
  return dd;
};

/**
 * EXIF 데이터에서 위도와 경도 추출
 */
const extractGpsData = (tags: any): { lat?: number, lng?: number } => {
  if (!tags.GPSLatitude || !tags.GPSLongitude) {
    return {};
  }

  try {
    const latDegrees = tags.GPSLatitude[0].numerator / tags.GPSLatitude[0].denominator;
    const latMinutes = tags.GPSLatitude[1].numerator / tags.GPSLatitude[1].denominator;
    const latSeconds = tags.GPSLatitude[2].numerator / tags.GPSLatitude[2].denominator;
    const latDirection = tags.GPSLatitudeRef;

    const lngDegrees = tags.GPSLongitude[0].numerator / tags.GPSLongitude[0].denominator;
    const lngMinutes = tags.GPSLongitude[1].numerator / tags.GPSLongitude[1].denominator;
    const lngSeconds = tags.GPSLongitude[2].numerator / tags.GPSLongitude[2].denominator;
    const lngDirection = tags.GPSLongitudeRef;

    const lat = convertDMSToDD(latDegrees, latMinutes, latSeconds, latDirection);
    const lng = convertDMSToDD(lngDegrees, lngMinutes, lngSeconds, lngDirection);

    return { lat, lng };
  } catch (error) {
    console.error('GPS 데이터 변환 중 오류:', error);
    return {};
  }
};

/**
 * 이미지 파일에서 메타데이터 추출
 */
export const extractImageMetadata = (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve) => {
    // 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    
    // 기본 메타데이터
    const metadata: ImageMetadata = {
      originalFile: file,
      previewUrl
    };

    // EXIF 데이터 추출
    const img = document.createElement('img');
    img.onload = function() {
      // 타입 지정하여 this 오류 해결
      EXIF.getData(img as any, function(this: any) {
        const tags = EXIF.getAllTags(this);
        
        // GPS 정보 추출
        if (tags) {
          const gpsData = extractGpsData(tags);
          if (gpsData.lat && gpsData.lng) {
            metadata.lat = gpsData.lat;
            metadata.lng = gpsData.lng;
          }
          
          // 촬영 시간 정보 추출
          if (tags.DateTimeOriginal) {
            const dateStr = tags.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3 ');
            metadata.timestamp = new Date(dateStr);
          }
        }
        
        resolve(metadata);
      });
    };
    img.src = previewUrl;
  });
};

/**
 * 이미지 메타데이터 일괄 처리
 */
export const processImageBatch = async (files: File[]): Promise<ImageMetadata[]> => {
  const metadataPromises = Array.from(files).map(file => extractImageMetadata(file));
  return Promise.all(metadataPromises);
};

/**
 * blob URL을 File 객체로 변환
 */
export const blobUrlToFile = async (blobUrl: string, fileName: string = 'image.jpg'): Promise<File> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
};

/**
 * 여러 blob URL을 File 객체로 변환
 */
export const convertBlobUrlsToFiles = async (imageUrls: { url: string; path: string }[]): Promise<File[]> => {
  const filePromises = imageUrls.map((image, index) => 
    blobUrlToFile(image.url, `photo-${index}.jpg`)
  );
  return Promise.all(filePromises);
}; 