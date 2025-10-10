import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StorageService } from './services/storage.service';

import { routes } from './app.routes';

// HTTP Interceptor للتعامل مع 401 Unauthorized
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  // Add token to request if available (skip for login/signup endpoints)
  const isAuthEndpoint = req.url.includes('/auth/user-login') ||
                         req.url.includes('/auth/signup');

  if (!isAuthEndpoint) {
    const tokenResult = storageService.getItem<string>('token');
    if (tokenResult.success && tokenResult.data) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${tokenResult.data}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        // Clear storage
        storageService.removeItem('user');
        storageService.removeItem('token');

        // Force page reload to clear all state
        window.location.href = '/login';
      }

      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
