export type UserRole = 'trainer' | 'student'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: UserRole
  phone: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

// ======= COURSES =======
export interface Course {
  id: string
  trainer_id: string
  title: string
  description: string | null
  cover_image: string | null
  status: 'draft' | 'published' | 'archived'
  course_code: string
  created_at: string
  updated_at: string
  lectures?: Lecture[]
  enrollments_count?: number
}

export interface Lecture {
  id: string
  course_id: string
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  attachments: Attachment[]
  presentation_url: string | null
  order_index: number
  duration_minutes: number | null
  is_published: boolean
  created_at: string
}

export interface Attachment {
  name: string
  url: string
  type: 'pdf' | 'image' | 'video' | 'other'
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected'

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  progress: number
  completed_at: string | null
  status: EnrollmentStatus
  responded_at: string | null
  responded_by: string | null
  course?: Course
  student?: Profile
}

// ======= EXAMS =======
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'

export interface Question {
  id: string
  exam_id: string
  question_text: string
  question_type: QuestionType
  options: QuestionOption[]
  correct_answer: string | string[] | null
  marks: number
  explanation: string | null
  order_index: number
  image_url: string | null
}

export interface QuestionOption {
  id: string
  text: string
}

export interface Exam {
  id: string
  trainer_id: string
  course_id: string | null
  title: string
  description: string | null
  instructions: string | null
  duration_minutes: number | null
  total_marks: number
  passing_marks: number
  share_token: string
  is_active: boolean
  show_results: boolean
  allow_review: boolean
  shuffle_questions: boolean
  created_at: string
  starts_at: string | null
  ends_at: string | null
  questions?: Question[]
}

export interface ExamSubmission {
  id: string
  exam_id: string
  student_id: string
  answers: Record<string, string | string[]>
  score: number | null
  total_marks: number | null
  percentage: number | null
  passed: boolean | null
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
  student?: Profile
  exam?: Exam
}

// ======= SURVEYS =======
export type SurveyQuestionType = 'rating' | 'multiple_choice' | 'checkbox' | 'text' | 'yes_no' | 'scale'

export interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: SurveyQuestionType
  options: string[]
  is_required: boolean
  order_index: number
}

export interface Survey {
  id: string
  trainer_id: string
  title: string
  description: string | null
  logo_url: string | null
  share_token: string
  is_active: boolean
  is_anonymous: boolean
  created_at: string
  ends_at: string | null
  questions?: SurveyQuestion[]
}

export interface SurveyResponse {
  id: string
  survey_id: string
  respondent_id: string | null
  answers: Record<string, string | string[] | number>
  submitted_at: string
}

// ======= CHALLENGES =======
export interface Challenge {
  id: string
  trainer_id: string
  course_id: string | null
  title: string
  description: string | null
  instructions: string | null
  challenge_type: 'quiz' | 'coding' | 'upload' | 'practical'
  total_marks: number
  time_limit_minutes: number | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
  questions?: ChallengeQuestion[]
}

export interface ChallengeQuestion {
  id: string
  challenge_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  options: QuestionOption[]
  correct_answer: string | string[] | null
  marks: number
  order_index: number
}

export interface ChallengeSubmission {
  id: string
  challenge_id: string
  student_id: string
  answers: Record<string, string | string[]>
  score: number | null
  percentage: number | null
  submitted_at: string
  student?: Profile
}

// ======= ASSIGNMENTS =======
export interface Assignment {
  id: string
  trainer_id: string
  course_id: string | null
  title: string
  description: string | null
  instructions: string | null
  attachments: Attachment[]
  total_marks: number
  due_date: string | null
  is_active: boolean
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  content: string | null
  file_urls: string[]
  score: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  student?: Profile
}

// ======= ATTENDANCE =======
export interface AttendanceSession {
  id: string
  trainer_id: string
  course_id: string | null
  lecture_id: string | null
  title: string
  session_code: string
  is_active: boolean
  activated_at: string | null
  closed_at: string | null
  created_at: string
  records?: AttendanceRecord[]
}

export type AttendanceStatus = 'pending' | 'approved' | 'rejected' | 'absent'

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  checked_in_at: string
  approved_at: string | null
  approved_by: string | null
  student?: Profile
}

// ======= NOTIFICATIONS =======
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'exam' | 'assignment' | 'attendance' | 'challenge' | 'course' | 'general'
  reference_id: string | null
  is_read: boolean
  created_at: string
}

// ======= BADGES =======
export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string | null
  condition_type: 'exam_score' | 'attendance_rate' | 'course_complete' | 'challenge_win' | 'submissions_count'
  condition_value: number
  trainer_id: string | null
}

export interface StudentBadge {
  id: string
  student_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}
