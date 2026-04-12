import { inject }     from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT Bearer token to every outgoing HTTP request
 * that targets the VaultFlow API. Skips auth endpoints.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  // Only attach token when present and request is to our API
  if (token && !req.url.includes('/auth/')) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};
