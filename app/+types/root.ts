import type { LinksFunction as RouterLinksFunction, MetaFunction as RouterMetaFunction } from "react-router";

export namespace Route {
  export type LinksFunction = RouterLinksFunction;
  export type MetaFunction = RouterMetaFunction;
  export type ErrorBoundaryProps = {
    error: unknown;
  };
}
