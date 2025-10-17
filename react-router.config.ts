import type { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/.well-known/*',
    element: null,
  },
  {
    path: '*',
    element: null,
  }
];

export default routes;
