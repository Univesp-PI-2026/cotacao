import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../config/api.config';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;

  return next(req.clone({ url: `${normalizedBaseUrl}${normalizedPath}` }));
};
