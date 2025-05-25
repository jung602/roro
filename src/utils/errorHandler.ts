type ErrorType = 'auth' | 'route' | 'storage' | 'network' | 'general';

interface ErrorDetails {
  message: string;
  code?: string;
  type: ErrorType;
  originalError?: any;
}

/**
 * 앱 전체에서 일관된 에러 처리를 위한 유틸리티
 */
export const handleError = (error: any, type: ErrorType = 'general'): ErrorDetails => {
  console.error(`Error (${type}):`, error);
  
  // Firebase 에러인 경우 코드 추출
  const errorCode = error?.code || 'unknown';
  
  // 에러 타입별 사용자 친화적 메시지 생성
  let userMessage: string;
  
  switch (type) {
    case 'auth':
      userMessage = getAuthErrorMessage(errorCode);
      break;
    case 'route':
      userMessage = '경로 정보를 처리하는 중 오류가 발생했습니다.';
      break;
    case 'storage':
      userMessage = '파일 저장 중 오류가 발생했습니다.';
      break;
    case 'network':
      userMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
      break;
    default:
      userMessage = '오류가 발생했습니다. 다시 시도해주세요.';
  }
  
  return {
    message: userMessage,
    code: errorCode,
    type,
    originalError: error
  };
};

/**
 * Firebase Authentication 에러 메시지를 사용자 친화적으로 변환
 */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/weak-password':
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/too-many-requests':
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
}

/**
 * 에러 알림 표시 함수 (필요시 Toast 또는 Alert 컴포넌트와 통합)
 */
export const showErrorNotification = (error: ErrorDetails): void => {
  // 여기에 Toast 또는 Alert 표시 로직 구현
  console.error(error.message);
}; 