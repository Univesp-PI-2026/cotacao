import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { API_BASE_URL } from './core/config/api.config';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: '/api'
    }
  ]
};
