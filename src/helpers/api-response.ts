
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    eventId?: string;
  }


export function SuccessResponse<T>(message: string, data: T | null): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }
  
export function FailureResponse<T>(message: any): ApiResponse<T> {
    return {
      success: false,
      message,
      data: null,
    };
  }
