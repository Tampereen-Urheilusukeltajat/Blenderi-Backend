export type RequestError = {
  statusCode: number;
  error: string;
  message?: string;
};

export type DBResponse<T> = T[];
