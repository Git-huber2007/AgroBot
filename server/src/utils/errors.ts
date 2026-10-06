export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required. Please sign in.') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to access this resource.') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfterSeconds?: number;

  constructor(message = 'Too many requests, please try again later.', retryAfterSeconds?: number, code = 'RATE_LIMIT_EXCEEDED') {
    super(429, code, message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AiError extends ApiError {
  constructor(code: 'AI_BLOCKED' | 'AI_TIMEOUT' | 'AI_UPSTREAM' | 'AI_SCHEMA_ERROR', statusCode: 502 | 504 = 502, message = 'Our AI agronomy advisor is temporarily busy. Please try again.') {
    super(statusCode, code, message);
    this.name = 'AiError';
  }
}

export class BadFileError extends ApiError {
  constructor(message: string) {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', message);
    this.name = 'BadFileError';
  }
}
