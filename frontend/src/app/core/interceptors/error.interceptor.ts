import { inject }          from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router }           from '@angular/router';
import { catchError }       from 'rxjs/operators';
import { throwError }       from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Global HTTP error handler:
 * - 401: logout + redirect to login
 * - 403: redirect to dashboard with notification
 * - 422/400: surface the error message to the user
 * - 5xx: show a generic server error toast
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  const notify  = inject(NotificationService);

  return next(req).pipe(
    catchError(err => {
      const status  = err.status as number;
      const message = err.error?.error ?? err.message ?? 'An unexpected error occurred';

      switch (true) {
        case status === 401:
          localStorage.removeItem('vf_token');
          localStorage.removeItem('vf_user');
          router.navigate(['/auth/login']);
          notify.error('Session expired', 'Please sign in again.');
          break;

        case status === 403:
          router.navigate(['/dashboard']);
          notify.error('Access denied', 'You do not have permission.');
          break;

        case status === 422 || status === 400:
          const validationMsg = err.error?.error ?? 'Validation failed. Please check your inputs.';
          notify.error('Unprocessable Entity', validationMsg);
          break;

        case status >= 500:
          notify.error('Server error', 'Something went wrong. Please try later.');
          break;

        default:
          if (status !== 0) notify.error('Error', message);
          break;
      }

      return throwError(() => err);
    })
  );
};
