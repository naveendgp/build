import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, of, timer } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

/**
 * ChaosInterceptor — Chaos Engineering for testing resilience.
 *
 * Activated ONLY when env var CHAOS_MODE=true.
 * Applies random failure scenarios to help you practice handling:
 *   1. Random HTTP errors (500, 503, 408, 429)
 *   2. Artificial latency (1–8 seconds)
 *   3. Partial/corrupted response data
 *   4. Empty responses
 *   5. Intermittent success (pass-through)
 *
 * Usage: Apply via @UseInterceptors(ChaosInterceptor) on controllers.
 * NEVER runs unless CHAOS_MODE=true in environment.
 */
@Injectable()
export class ChaosInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ChaosInterceptor');

  // Probability that chaos is injected on any given request (0.0 – 1.0)
  private readonly chaosProbability = 0.55; // 55% of requests get chaos

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // ─── Safety gate: only run when CHAOS_MODE is explicitly enabled ───
    if (process.env.CHAOS_MODE !== 'true') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    // Roll the dice — some requests pass through cleanly
    if (Math.random() > this.chaosProbability) {
      this.logger.debug(`[CHAOS] ${route} → passed through (lucky)`);
      return next.handle();
    }

    // Pick a chaos scenario
    const scenario = this.pickScenario();
    this.logger.warn(`[CHAOS] ${route} → scenario: ${scenario}`);

    switch (scenario) {
      case 'error_500':
        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                message: 'Internal server error (chaos)',
                chaos: true,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );

      case 'error_503':
        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                message: 'Service temporarily unavailable (chaos)',
                chaos: true,
              },
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
        );

      case 'error_408':
        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                message: 'Request timeout (chaos)',
                chaos: true,
              },
              HttpStatus.REQUEST_TIMEOUT,
            ),
        );

      case 'error_429':
        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                message: 'Too many requests (chaos)',
                chaos: true,
              },
              HttpStatus.TOO_MANY_REQUESTS,
            ),
        );

      case 'latency':
        // Add 1–8 seconds of artificial delay, then return real response
        const delayMs = Math.floor(Math.random() * 7000) + 1000;
        this.logger.warn(`[CHAOS] ${route} → adding ${delayMs}ms latency`);
        return timer(delayMs).pipe(mergeMap(() => next.handle()));

      case 'partial_response':
        // Let the real handler run, then strip/corrupt parts of the response
        return next.handle().pipe(
          map((data) => {
            if (data && typeof data === 'object') {
              return this.corruptResponse(data);
            }
            return data;
          }),
        );

      case 'empty_response':
        // Return an empty success with no data
        return of({
          success: true,
          message: 'OK',
          data: null,
        });

      case 'wrong_status':
        // Return the real data but with a misleading wrapper
        return next.handle().pipe(
          map((data) => ({
            success: false,
            message: 'Unknown error occurred',
            data: data,
            chaos: true,
          })),
        );

      default:
        return next.handle();
    }
  }

  /**
   * Randomly pick a chaos scenario with weighted probabilities.
   */
  private pickScenario(): string {
    const scenarios = [
      { name: 'error_500', weight: 15 },
      { name: 'error_503', weight: 10 },
      { name: 'error_408', weight: 8 },
      { name: 'error_429', weight: 7 },
      { name: 'latency', weight: 25 },
      { name: 'partial_response', weight: 15 },
      { name: 'empty_response', weight: 10 },
      { name: 'wrong_status', weight: 10 },
    ];

    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) return scenario.name;
    }

    return 'error_500';
  }

  /**
   * Corrupt a response object by randomly removing keys or nullifying values.
   */
  private corruptResponse(data: any): any {
    // Work on a shallow copy
    const copy = { ...data };
    const keys = Object.keys(copy);

    if (keys.length === 0) return copy;

    // Randomly remove 1–3 keys or set them to null
    const corruptCount = Math.min(
      keys.length,
      Math.floor(Math.random() * 3) + 1,
    );

    for (let i = 0; i < corruptCount; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (Math.random() > 0.5) {
        delete copy[randomKey]; // remove key entirely
      } else {
        copy[randomKey] = null; // nullify
      }
    }

    return copy;
  }
}
