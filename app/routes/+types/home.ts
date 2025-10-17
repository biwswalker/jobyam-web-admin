import type { LoaderFunctionArgs, MetaFunction } from "react-router-dom";

export namespace Route {
  export type MetaArgs = Parameters<MetaFunction>[0];
  export type LoaderArgs = LoaderFunctionArgs;
}
