interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  eventId?: string;
}

export function SuccessResponse<T>(
  message: string,
  data: T | null
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}
export function SuccessResponseV2<T>(
  message: string,
  data: T | null,
  eventId: string | null
): ApiResponse<T> {
  return {
    success: true,
    message,
    eventId,
    data,
  };
}

export function FailureResponse<T>(
  message: any,
  eventId: string | null
): ApiResponse<T> {
  return {
    success: false,
    message,
    eventId,
    data: null,
  };
}
