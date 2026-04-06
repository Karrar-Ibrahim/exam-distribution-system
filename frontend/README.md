# نظام توزيع الامتحانات — الواجهة الأمامية

Arabic RTL admin dashboard built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| Components | shadcn/ui (Radix UI primitives) |
| Data fetching | TanStack Query v5 |
| HTTP client | Axios (with silent JWT refresh) |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Theme | next-themes (light / dark / system) |
| Font | Cairo (Google Fonts — Arabic + Latin) |
| Direction | RTL (`dir="rtl"` on `<html>`) |

---

## Prerequisites

- Node.js >= 18
- npm >= 9 (or pnpm / yarn)
- Django backend running at `http://localhost:8000` (see `../exam_distribution_system/`)

---

## Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL if backend is not on localhost:8000

# 3. Development server
npm run dev
# → http://localhost:3000

# 4. Production build
npm run build
npm start
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |

Copy `.env.example` to `.env.local` and adjust before starting.

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/login/         # Public login page
│   └── (dashboard)/          # Protected dashboard pages
│       ├── layout.tsx        # Auth guard + sidebar + navbar
│       ├── dashboard/
│       ├── teachers/
│       ├── classrooms/
│       ├── exams/
│       ├── distributions/
│       │   └── history/
│       ├── users/
│       └── settings/
├── components/
│   ├── common/               # Reusable UI pieces
│   │   ├── confirm-dialog.tsx
│   │   ├── data-table.tsx    # Table with pagination + error + empty states
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx   # Error + inline error components
│   │   ├── loading-spinner.tsx
│   │   ├── page-header.tsx
│   │   ├── permission-guard.tsx
│   │   └── stat-card.tsx
│   ├── layout/               # Sidebar, Navbar, MobileSidebar
│   ├── theme/                # ThemeSwitcher
│   └── ui/                   # shadcn/ui primitives
├── config/
│   ├── api-routes.ts         # All backend endpoint paths
│   └── navigation.tsx        # Sidebar nav tree + permissions
├── features/                 # Feature-based modules
│   ├── auth/
│   ├── classrooms/
│   ├── dashboard/
│   ├── distributions/
│   ├── exams/
│   ├── settings/
│   ├── teachers/
│   └── users/
├── hooks/
│   └── use-auth.ts           # Auth state, can(), canSee(), logout()
├── lib/
│   ├── auth.ts               # Token storage (localStorage + cookie)
│   ├── axios.ts              # Axios instance + 401 refresh queue
│   └── utils.ts              # cn(), formatDate(), getInitials()
├── middleware.ts             # Route guard (redirects unauthenticated)
├── providers/                # ThemeProvider, QueryProvider, Toaster
└── types/index.ts            # All shared TypeScript types
```

---

## Authentication Flow

1. User submits email + password on `/login`
2. Backend returns `accessToken`, `refresh`, `userData`, `userAbilities`
3. Tokens stored in `localStorage` + access token mirrored to a cookie (for middleware)
4. All Axios requests attach `Authorization: Bearer <token>`
5. On 401, a refresh is attempted once; if it fails, the user is redirected to `/login`
6. `middleware.ts` reads the cookie and redirects unauthenticated requests server-side

---

## Permission System

```ts
// Backend returns userAbilities: [{ action, subject }]
// Super users get: [{ action: "manage", subject: "all" }]

const { can, canSee } = useAuth();

can("create", "classroom")     // true if user has that ability
canSee("teaching_management")  // true if user can read that module
```

Wrap UI elements with `<PermissionGuard module="classroom" action="delete">` to conditionally render.

Navigation items with a `permission` field are hidden automatically when the user lacks the `read` ability for that module.

---

## API Conventions

All CRUD endpoints return a `PaginatedResponse<T>`:

```json
{
  "count": 42,
  "total_pages": 5,
  "current_page": 1,
  "next": "...",
  "previous": null,
  "results": [...]
}
```

Pass `{ page, search, date? }` as query params. The Axios instance handles base URL and auth headers.

---

## Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to your production backend URL
- [ ] Ensure backend CORS allows your frontend origin
- [ ] Backend `DEBUG=False`, `ALLOWED_HOSTS` configured
- [ ] Use HTTPS for both frontend and backend
- [ ] Replace `localStorage` token storage with `httpOnly` cookies if XSS is a concern
- [ ] Set `Content-Security-Policy` headers (Next.js `next.config.mjs` → `headers()`)
- [ ] Run `npm run build` and verify 0 TypeScript / ESLint errors
- [ ] Test dark mode, RTL layout, and mobile sidebar on target devices
- [ ] Test permission-based nav hiding for non-super users

---

## Smoke Test Checklist

See the bottom of this README — or run through these flows manually after deployment:

### Auth
- [ ] `/login` loads; enter wrong credentials → Arabic error message shown
- [ ] Enter correct credentials → redirect to `/dashboard`
- [ ] Refresh page → stays logged in (token preserved)
- [ ] Click logout → redirected to `/login`, can't go back

### Dashboard
- [ ] Stat cards show numbers (teachers, classrooms, exams, distributions)
- [ ] "آخر عمليات التوزيع" shows recent batches
- [ ] Quick actions navigate correctly

### Classrooms `/classrooms`
- [ ] Table loads with pagination
- [ ] Search filters results
- [ ] Add classroom → appears in table
- [ ] Edit classroom → changes reflected
- [ ] Delete classroom → confirmation → removed from list
- [ ] Error state shown if backend is down (with retry button)

### Teachers `/teachers`
- [ ] Same CRUD flow as classrooms
- [ ] Search by name works
- [ ] Degree badge renders correctly (دكتوراه / ماجستير / بكالوريوس)

### Exams `/exams`
- [ ] Table loads with date + room columns
- [ ] Date filter narrows results; clear button resets
- [ ] Multi-time create → multiple rows created
- [ ] Edit shows single time field pre-filled

### Distributions `/distributions`
- [ ] Stat cards and two-panel layout visible
- [ ] Create form: date + time + classroom selection + periodic toggle
- [ ] Submit → success banner → detail modal auto-opens
- [ ] Batch detail modal groups teachers by classroom with badges
- [ ] Export single batch → `.xlsx` download
- [ ] Export all → `.xlsx` download
- [ ] Delete batch → confirmation → removed

### History `/distributions/history`
- [ ] Full paginated list
- [ ] Date filter works
- [ ] View details modal opens
- [ ] Back button returns to `/distributions`

### Settings `/settings`
- [ ] Theme switcher (light / dark / system) persists across pages

### Users `/users`
- [ ] Super user sees user management shell
- [ ] Non-super user sees access denied message

### Permission Guards
- [ ] Log in as non-super admin without `classroom` ability → no Add/Edit/Delete buttons on classrooms page
- [ ] Log in as non-super admin without `teachers_divide` → no توزيع item in sidebar

---

## Development Notes

- **RTL**: All Tailwind spacing uses logical properties: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`. Do not use `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`.
- **Icons**: Lucide React icons are not automatically mirrored in RTL — use `rtl:rotate-180` where needed (e.g., ArrowLeft in breadcrumbs).
- **Toasts**: Sonner is configured with `dir="rtl"` and `position="top-center"`.
- **Query stale time**: Default 5 minutes. Classroom options (used in distribution form) cache for 10 minutes.
- **Token refresh**: A single in-flight refresh request is shared across all concurrent 401s via a queue in `src/lib/axios.ts`.
