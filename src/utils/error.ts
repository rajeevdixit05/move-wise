export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (error: unknown) => {
  if (error instanceof AppError) {
    return { error: error.message, code: error.code, status: error.status }
  }
  return { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR', status: 500 }
} 