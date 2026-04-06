export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login/",
    REFRESH: "/api/auth/refresh/",
    LOGOUT: "/api/auth/logout/",
  },

  // Users
  USERS: {
    LIST:        "/api/auth/users/",
    DETAIL:      (id: number) => `/api/auth/users/${id}/`,
    PERMISSIONS: (id: number) => `/api/auth/users/${id}/permissions/`,
    LOGS:        "/api/auth/logs/",
  },

  // Teachers
  TEACHERS: {
    LIST: "/api/teachers/",
    DETAIL: (id: number) => `/api/teachers/${id}/`,
    EXCLUSIONS: "/api/teachers/exclusions/",
    EXCLUSION_DETAIL: (id: number) => `/api/teachers/exclusions/${id}/`,
  },

  // Classrooms
  CLASSROOMS: {
    LIST: "/api/classrooms/",
    DETAIL: (id: number) => `/api/classrooms/${id}/`,
    OPTIONS: "/api/classrooms/division-options/",
  },

  // Exams
  EXAMS: {
    LIST: "/api/exams/",
    DETAIL: (id: number) => `/api/exams/${id}/`,
  },

  // Distributions
  DISTRIBUTIONS: {
    CREATE: "/api/distributions/create/",
    BATCHES: "/api/distributions/batches/",
    BATCH_DELETE: (id: number) => `/api/distributions/batches/${id}/`,
    DASHBOARD: "/api/distributions/dashboard/",
    EXPORT: "/api/distributions/export/",
    EXPORT_BATCH: (id: number) => `/api/distributions/export/?id=${id}`,
    TEACHER_STATS: "/api/distributions/teacher-stats/",
    TEACHER_STATS_EXPORT: "/api/distributions/teacher-stats/export/",
  },
} as const;
