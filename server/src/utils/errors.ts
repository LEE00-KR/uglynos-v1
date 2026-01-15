export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource}을(를) 찾을 수 없습니다`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class InsufficientResourceError extends AppError {
  constructor(resource: string) {
    super(400, 'INSUFFICIENT_RESOURCE', `${resource}이(가) 부족합니다`);
  }
}

export class BattleError extends AppError {
  constructor(code: string, message: string) {
    super(400, code, message);
  }
}
