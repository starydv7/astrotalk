import type { ZodError } from 'zod';

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: unknown;
  };
}

export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly retryable = false,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function validationError(error: ZodError): AppError {
  return new AppError(400, 'VALIDATION_ERROR', 'The request is invalid.', false, {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

export function errorEnvelope(error: AppError): ErrorEnvelope {
  const body: ErrorEnvelope = {
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    },
  };
  if (error.details !== undefined) {
    body.error.details = error.details;
  }
  return body;
}
