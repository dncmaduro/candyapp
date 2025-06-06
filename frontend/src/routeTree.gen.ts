/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as StorageIndexImport } from './routes/storage/index'
import { Route as LogsIndexImport } from './routes/logs/index'
import { Route as CalfileIndexImport } from './routes/calfile/index'
import { Route as CalIndexImport } from './routes/cal/index'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const StorageIndexRoute = StorageIndexImport.update({
  id: '/storage/',
  path: '/storage/',
  getParentRoute: () => rootRoute,
} as any)

const LogsIndexRoute = LogsIndexImport.update({
  id: '/logs/',
  path: '/logs/',
  getParentRoute: () => rootRoute,
} as any)

const CalfileIndexRoute = CalfileIndexImport.update({
  id: '/calfile/',
  path: '/calfile/',
  getParentRoute: () => rootRoute,
} as any)

const CalIndexRoute = CalIndexImport.update({
  id: '/cal/',
  path: '/cal/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/cal/': {
      id: '/cal/'
      path: '/cal'
      fullPath: '/cal'
      preLoaderRoute: typeof CalIndexImport
      parentRoute: typeof rootRoute
    }
    '/calfile/': {
      id: '/calfile/'
      path: '/calfile'
      fullPath: '/calfile'
      preLoaderRoute: typeof CalfileIndexImport
      parentRoute: typeof rootRoute
    }
    '/logs/': {
      id: '/logs/'
      path: '/logs'
      fullPath: '/logs'
      preLoaderRoute: typeof LogsIndexImport
      parentRoute: typeof rootRoute
    }
    '/storage/': {
      id: '/storage/'
      path: '/storage'
      fullPath: '/storage'
      preLoaderRoute: typeof StorageIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/cal': typeof CalIndexRoute
  '/calfile': typeof CalfileIndexRoute
  '/logs': typeof LogsIndexRoute
  '/storage': typeof StorageIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/cal': typeof CalIndexRoute
  '/calfile': typeof CalfileIndexRoute
  '/logs': typeof LogsIndexRoute
  '/storage': typeof StorageIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/cal/': typeof CalIndexRoute
  '/calfile/': typeof CalfileIndexRoute
  '/logs/': typeof LogsIndexRoute
  '/storage/': typeof StorageIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/cal' | '/calfile' | '/logs' | '/storage'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/cal' | '/calfile' | '/logs' | '/storage'
  id: '__root__' | '/' | '/cal/' | '/calfile/' | '/logs/' | '/storage/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  CalIndexRoute: typeof CalIndexRoute
  CalfileIndexRoute: typeof CalfileIndexRoute
  LogsIndexRoute: typeof LogsIndexRoute
  StorageIndexRoute: typeof StorageIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  CalIndexRoute: CalIndexRoute,
  CalfileIndexRoute: CalfileIndexRoute,
  LogsIndexRoute: LogsIndexRoute,
  StorageIndexRoute: StorageIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/cal/",
        "/calfile/",
        "/logs/",
        "/storage/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/cal/": {
      "filePath": "cal/index.tsx"
    },
    "/calfile/": {
      "filePath": "calfile/index.tsx"
    },
    "/logs/": {
      "filePath": "logs/index.tsx"
    },
    "/storage/": {
      "filePath": "storage/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
