# Folder Structure

Conventions for how the codebase is organized. Covers the global layout and the
`@/api`, `@/app`, and `@/modules` folders.

## Global folder architecture

```
--github
  +-- workflows        # workflows for the different environments
--husky
--cypress
--docs
--public              # assets folder; holds all local image types
--src
  |
  +-- api             # request functions: queries and mutations for the endpoints
  |   +-- see "@/api" below
  |
  +-- app             # routing (layouts, pages, route handlers)
  |   +-- see "@/app" below
  |
  +-- components      # shared components used across the app
  |   +-- ui          # folder where shadcn components are installed
  |
  +-- config          # all global config, environment variables, etc.
  |
  +-- hooks           # shared hooks used across the app
  |   +-- utils       # common utility hooks
  |
  +-- lib             # external library and provider setup
  |   +-- providers   # exports the global provider
  |
  +-- modules         # module-based folders
  |   +-- see "@/modules" below
  |
  +-- styles          # app theme styles and variants
  |
  +-- types           # base types used across the app
  |
  +-- utils           # shared utility functions
  |   +-- functions   # common shared functions
  |   +-- static      # shared static/mock values
  |   +-- formatters  # shared formatters
  |   +-- parser      # shared parsers
  |   +-- regex       # shared regexes
  |
  +- auth.config.ts   # auth configuration
  |
  +- auth.ts          # auth setup
  |
  +- proxy.ts         # request proxy (ex-"middleware") — session refresh + redirects
```

## `@/api`

Request functions (queries and mutations) grouped by endpoint.

## `@/app`

### 1. Basic structure

```
-- app
   |
   +-- layout.tsx               # Global layout applied to every route
   +-- page.tsx                 # Home page (root route '/')
   +-- dashboard                # Folder representing the '/dashboard' route
   |   +-- layout.tsx           # Layout applied to '/dashboard'
   |   +-- page.tsx             # Page rendered at '/dashboard'
   |   +-- settings             # Subroute '/dashboard/settings'
   |       +-- page.tsx         # Page rendered at '/dashboard/settings'
   |       +-- layout.tsx       # Layout specific to '/dashboard/settings'
   |
   +-- about                    # Folder representing the '/about' route
       +-- page.tsx             # Page rendered at '/about'
```

### 2. Route groups

```
-- app
   |
   +-- (private)                # Private route group
   |   |
   |   +-- dashboard
   |   |     +-- layout.tsx     # layout specific to dashboard
   |   |     +-- page.tsx       # route /dashboard
   |   |
   |   +-- settings
   |   |      +-- layout.tsx    # layout specific to settings
   |   |      +-- page.tsx      # route /settings
   |   |
   |   +-- layout.tsx           # layout for the private group
   |
   +-- (marketing)              # Marketing route group
   |   |
   |   +-- blog
   |   |     +-- layout.tsx     # layout specific to blog
   |   |     +-- page.tsx       # route /blog
   |   |
   |   +-- post
   |   |      +-- layout.tsx    # layout specific to post
   |   |      +-- page.tsx      # route /post
   |   |
   |   +-- layout.tsx           # layout for the marketing group
   |
   +-- page.tsx                 # route /
   +-- layout.tsx               # global layout
```

### 3. Dynamic routes

```
-- app
   |
   +-- (marketing)              # Marketing route group
   |   |
   |   +-- blog
   |   |     +-- layout.tsx     # Layout specific to blog
   |   |     +-- page.tsx       # route /blog
   |   |     +-- [id]           # dynamic segment
   |   |          +-- page.tsx    # route /blog/[id]
   |   |          +-- layout.tsx  # layout specific to blog/[id]
   |   |
   |   +-- post
   |   |      +-- layout.tsx    # layout specific to post
   |   |      +-- page.tsx      # route /post
   |   |      +-- [...slug]     # catch-all dynamic segment
   |   |           +-- page.tsx     # route /post/[...slug]
   |   |           +-- layout.tsx   # layout specific to post/[...slug]
   |   |
   |   +-- layout.tsx           # layout for the marketing group
   |
   +-- page.tsx                 # route /
   +-- layout.tsx               # global layout
```

### 4. Error handling

```
-- app
   |
   +-- (marketing)            # Marketing route group
   |   |
   |   +-- blog
   |        +-- layout.tsx    # Layout specific to blog
   |        +-- page.tsx      # route /blog
   |        +-- error.ts      # dedicated route for error handling
   |
   +-- page.tsx               # route /
   +-- layout.tsx             # global layout
```

### 5. Per-route loading (Suspense API)

```
-- app
   |
   +-- (marketing)            # Marketing route group
   |   |
   |   +-- blog
   |        +-- layout.tsx    # Layout specific to blog
   |        +-- page.tsx      # route /blog
   |        +-- loading.ts    # dedicated route for loading
   |
   +-- page.tsx               # route /
   +-- layout.tsx             # global layout
```

### 6. Parallel routes

Render one or more pages within the same layout, simultaneously or conditionally.

```
-- app
   +-- @team
   |   +-- default.tsx    # fallback during initial load
   |   +-- page.tsx
   |
   +-- @analytics
   |   +-- default.tsx    # fallback during initial load
   |   +-- page.tsx
   |
   +-- default.tsx        # fallback during initial load
   +-- page.tsx           # route /
   +-- layout.tsx         # global layout
```

```typescript
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  );
}
```

Common use cases:

1. [Conditional routes (role based)](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#conditional-routes)
2. [Tabs](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#tab-groups)
3. [Modals](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#modals)

## `@/modules`

```
-- modules
   |
   +-- auth
   +-- private
   |   +-- components
   |   +-- contexts
   |   +-- hooks
   |   +-- utils
   |   +-- pages
   |         +-- Dashboard
   |         |    +-- components
   |         |    |    +-- DashboardTable
   |         |    |        +- DashboardTable.tsx
   |         |    |        +- index.ts
   |         |    +-- hooks
   |         |    +-- utils
   |         |    +- Dashboard.tsx
   |         |    +- index.ts
   |         +-- Profile
   |             +-- components
   |             +-- hooks
   |             +-- utils
   |             +- Profile.tsx
   |             +- index.ts
   +- index.ts
```

### General notes and rules

1. Module names must be lowerCase / camelCase.
2. If a component/util/hook is used in more than one page, lift it up to the module level.
3. If a component/util/hook is used in more than one module, lift it up to the global level.
4. There is no per-module API layer in this structure.
