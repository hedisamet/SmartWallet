import { inject }        from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }   from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && !auth.isTokenExpired()) {
    return true;
  }

  // Redirect to login, preserving the intended URL
  return router.createUrlTree(['/auth/login']);
};
