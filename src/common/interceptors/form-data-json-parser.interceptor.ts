import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FormDataJsonParserInterceptor implements NestInterceptor {
  constructor(private readonly jsonFields: string[] = []) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (body && this.jsonFields.length > 0) {
      // Parse JSON fields from form-data
      this.jsonFields.forEach((field) => {
        if (body[field] !== undefined && body[field] !== null) {
          // If it's already an object, skip parsing
          if (
            typeof body[field] === 'object' &&
            !Array.isArray(body[field])
          ) {
            return; // Already parsed
          }

          // If it's a string, parse it
          if (typeof body[field] === 'string') {
            try {
              const trimmed = body[field].trim();
              if (trimmed) {
                body[field] = JSON.parse(trimmed);
              }
            } catch (error) {
              // If parsing fails, keep original value
              console.error(`Error parsing ${field}:`, error);
            }
          }
        }
      });
    }

    return next.handle();
  }
}

