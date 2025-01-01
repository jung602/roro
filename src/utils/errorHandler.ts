type ErrorType = 'AUTH' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN';

interface ErrorResponse {
  type: ErrorType;
  message: string;
}

export const handleError = (error: unknown): ErrorResponse => {
  console.error('Error occurred:', error);

  if (error instanceof Error) {
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return {
        type: 'AUTH',
        message: '로그인이 필요하거나 인증에 실패했습니다.'
      };
    }
    if (error.message.includes('network') || error.message.includes('connection')) {
      return {
        type: 'NETWORK',
        message: '네트워크 연결을 확인해주세요.'
      };
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        type: 'VALIDATION',
        message: '입력값이 올바르지 않습니다.'
      };
    }
  }

  return {
    type: 'UNKNOWN',
    message: '알 수 없는 오류가 발생했습니다.'
  };
};

export const showErrorMessage = (error: unknown): void => {
  const { message } = handleError(error);
  alert(message);
}; 