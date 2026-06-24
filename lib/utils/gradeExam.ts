import type { Question } from '@/lib/types'

export function gradeExam(
  questions: Question[],
  answers: Record<string, string | string[]>
): { score: number; breakdown: Record<string, { earned: number; total: number; correct: boolean }> } {
  let score = 0
  const breakdown: Record<string, { earned: number; total: number; correct: boolean }> = {}

  for (const question of questions) {
    const studentAnswer = answers[question.id]
    const correctAnswer = question.correct_answer
    let isCorrect = false

    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
      breakdown[question.id] = { earned: 0, total: question.marks, correct: false }
      continue
    }

    switch (question.question_type) {
      case 'multiple_choice':
      case 'true_false':
        isCorrect = studentAnswer === correctAnswer
        break
      case 'short_answer':
        if (typeof studentAnswer === 'string' && typeof correctAnswer === 'string') {
          isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        }
        break
      case 'essay':
        isCorrect = false // يحتاج تصحيحاً يدوياً
        break
    }

    const earned = isCorrect ? question.marks : 0
    score += earned
    breakdown[question.id] = { earned, total: question.marks, correct: isCorrect }
  }

  return { score, breakdown }
}
