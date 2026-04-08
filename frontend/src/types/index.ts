// ─── Auth ────────────────────────────────────────────────────────────
export interface UserData {
  id: number;
  fullName: string;
  email: string;
  role: "super" | "admin";
  username: string;
  lang: string;
}

export interface UserAbility {
  action: string;
  subject: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refresh: string;
  token_type: string;
  expires_in: number;
  userData: UserData;
  userAbilities: UserAbility[];
}

export interface LoginInput {
  email: string;
  password: string;
}

// ─── Pagination ──────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  lang?: string;
  date?: string;
}

// ─── Teacher ─────────────────────────────────────────────────────────
export type TeacherTitle =
  | "استاذ"
  | "استاذ مساعد"
  | "مدرس"
  | "مدرس مساعد";

export type TeacherDegree = "دكتوراه" | "ماجستير" | "بكالوريوس";

export interface Teacher {
  id: number;
  name: string;
  formatted_name: string;
  title: TeacherTitle;
  degree: TeacherDegree;
  type: 1 | 2;
  lang: string;
  distribution_count: number;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherFormData {
  name: string;
  title: TeacherTitle;
  degree: TeacherDegree;
  lang?: string;
}

export interface ImportError {
  row: number;
  name: string;
  errors: string[];
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportError[];
}

// ─── Classroom ───────────────────────────────────────────────────────
export interface Classroom {
  id: number;
  room_number: string;
  capacity: number;
  num_invigilators: number;
  lang: string;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClassroomFormData {
  room_number: string;
  capacity: number;
  num_invigilators: number;
  lang?: string;
}

export interface ClassroomOption {
  id: number;
  room_number: string;
  capacity: number;
  num_invigilators: number;
  lang: string;
}

// ─── Exam ────────────────────────────────────────────────────────────
export interface Exam {
  id: number;
  exam: string;
  date: string;
  time: string;
  classroom_id: number | null;
  room_number: string | null;
  lang: string;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExamFormData {
  exam: string;
  date: string;
  time: string | string[];
  classroom?: number | null;
  lang?: string;
}

// ─── Distribution ────────────────────────────────────────────────────
export interface DistributionAssignment {
  id: number;
  batch_id: number;
  classroom_id: number | null;
  room_label: string;
  date: string;
  teacher_id: number | null;
  teacher_name: string;
  teacher_formatted_name: string;
  degree: string;
  time: string;
  active: boolean;
  count: number;
  type: 1 | 2;
}

export interface DistributionBatch {
  id: number;
  date: string;
  time: string;
  lang: string;
  classrooms_count: number;
  teachers_count: number;
  assignments: DistributionAssignment[];
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DistributionCreateData {
  date: string;
  time: string;
  classroom_ids?: number[];
  lang?: string;
  periodic_distribution?: boolean;
  require_phd_first_slot?: boolean;
}

export interface DistributionBatchParams {
  page?: number;
  itemsPerPage?: number;
  date?: string;
}

export interface DashboardData {
  total_teachers: number;
  total_classrooms: number;
  total_exams: number;
  batches: DistributionBatch[];
}

// ─── Teacher Statistics ──────────────────────────────────────────────
export interface TeacherAssignmentDetail {
  id: number;
  date: string;
  room_label: string;
  time: string;
  batch_id: number;
}

export interface TeacherStat {
  teacher_id: number;
  name: string;
  formatted_name: string;
  title: string;
  degree: TeacherDegree;
  type: 1 | 2;
  total_count: number;
  last_assignment_date: string | null;
  assignments: TeacherAssignmentDetail[];
}

export interface TeacherStatsResponse extends PaginatedResponse<TeacherStat> {
  total_assignments: number;
}

export interface TeacherStatsParams {
  page?: number;
  search?: string;
  date?: string;
}

// ─── Teacher Exclusion ───────────────────────────────────────────────
export interface TeacherExclusion {
  id: number;
  teacher_id: number;
  teacher_name: string;
  teacher_title: string;
  teacher_degree: TeacherDegree;
  date: string;
  reason: string;
  created_at: string;
}

export interface TeacherExclusionFormData {
  teacher_id: number;
  date: string;
  reason?: string;
}

export interface ExclusionParams {
  page?: number;
  search?: string;
  date?: string;
}

// ─── User Management ─────────────────────────────────────────────────
export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: "super" | "admin";
  lang: string;
  is_active: boolean;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SystemUserFormData {
  name: string;
  email: string;
  password?: string;
  role?: "super" | "admin";
  lang?: string;
  is_active?: boolean;
}

export interface ModulePermission {
  id: number | null;
  name: string;
  can_show: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_posted: boolean;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string;
  action: string;
  action_label: string;
  module: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogParams {
  page?: number;
  search?: string;
  user_id?: number;
  action?: string;
  module?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Common ──────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
}

export interface ApiError {
  message?: string;
  detail?: string;
  [key: string]: unknown;
}
