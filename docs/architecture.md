# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and contract-driven. Route-level screens should render data from the shared API client, manage loading/empty/error UI states, and rely on accessible text and roles instead of business logic in the browser. The frontend should only transform API data for display and call the correct `/api` endpoints for each capability.
- Logic tier decision: Keep Express handlers focused on validation, request parsing, and orchestration, while reusable services do the domain work. Route handlers should reject invalid IDs or missing fields with deliberate 4xx responses and never leak a Mongo cast error as a 500.
- Data tier decision: Use Mongoose schemas as the source of truth for required fields, relationships, and defaults, then seed realistic user, team, activity, and workout documents from a script. Validation should live in the models so the backend and seeding stay aligned.
- Activity tracking approach: Store `user` and `team` as references to the seeded records, keep a `type` and `minutes`, and compute `points` and `occurredAt` on creation. Validate that the submitted `userId` and `teamId` resolve to existing records before saving; otherwise return a 4xx.
- Team management approach: Require a non-empty team `name` and persist `mascot` plus a `members` array. Keep team data simple and explicit so leaderboard and activity records can aggregate cleanly without hidden logic.
- Leaderboard approach: Aggregate activity points per team using the team activity records, sort in descending total points order, and assign a 1-based rank. The API response should expose `teamName`, `totalPoints`, and `rank` without additional presentation-only metadata.
- Workout suggestions approach: Match a request by seeded user email, inspect that user’s recent activity patterns, and return suggestions that align to their goal or recent focus. Each suggestion should include a `focus`, `minutes`, `difficulty`, and a `reason` explaining the recommendation.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - This validates the Mongoose contracts and seed data. Failures here usually mean required fields, relationships, or defaults are missing in the schema or seed script before API behavior is even exercised.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - This validates the Express routes, HTTP status codes, request validation, and aggregate logic. Failures usually mean the route or service layer is not enforcing the contract defined by the architecture.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - This validates the presentation layer: rendered content, loading states, empty states, error alerts, and calls to the API client. Failures here usually mean the app is not showing the expected contract output, even when the API is correct.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - This validates TypeScript correctness and compile-time integrity for the logic/data layers. Failure indicates a type or module mismatch that blocks the backend from building cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - This validates TypeScript and Vite build health for the presentation layer. Failure indicates broken imports, JSX/type issues, or a frontend contract mismatch that prevents the UI bundle from compiling.
