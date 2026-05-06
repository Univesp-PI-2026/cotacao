import { sharedEnvironment } from './environment.shared';

export const environment = {
  production: true,
  apiUrl: sharedEnvironment.productionApiUrl,
};
