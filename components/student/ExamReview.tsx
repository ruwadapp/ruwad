import type { Question, ExamSubmission } from '@/lib/types'
import { CheckCircle2, XCircle } from 'lucide-react'

export function ExamReview({ questions, submission }: { questions: Question[]; submission: ExamSubmission }) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, idx) => {
        const studentAnswer = submission.answers[q.id]
        const correct = q.correct_answer
        const isCorrect =
          q.question_type === 'short_answer'
            ? typeof studentAnswer === 'string' &&
              typeof correct === 'string' &&
              studentAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
            : studentAnswer === correct

        const studentAnswerLabel =
          q.question_type === 'multiple_choice'
            ? q.options.find((o) => o.id === studentAnswer)?.text ?? 'بلا إجابة'
            : q.question_type === 'true_false'
            ? studentAnswer === 'true' ? 'صحيح' : studentAnswer === 'false' ? 'خطأ' : 'بلا إجابة'
            : (studentAnswer as string) || 'بلا إجابة'

        const correctAnswerLabel =
          q.question_type === 'multiple_choice'
            ? q.options.find((o) => o.id === correct)?.text ?? ''
            : q.question_type === 'true_false'
            ? correct === 'true' ? 'صحيح' : 'خطأ'
            : (correct as string) ?? ''

        return (
          <div key={q.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
            <p className="text-sm text-ruwad-navy/50">سؤال {idx + 1} · {q.marks} درجة</p>
            <p className="font-medium text-ruwad-navy">{q.question_text}</p>

            {q.question_type === 'essay' ? (
              <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3">
                <p className="text-sm text-ruwad-navy/60 mb-1">إجابتك:</p>
                <p className="text-ruwad-navy">{studentAnswerLabel}</p>
                <p className="text-xs text-ruwad-navy/50 mt-2">يحتاج تصحيحاً يدوياً من المدرب</p>
              </div>
            ) : (
              <>
                <div
                  className={`flex items-start gap-2 rounded-ruwad-sm p-3 ${
                    isCorrect ? 'bg-ruwad-lime/20' : 'bg-red-50'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm text-ruwad-navy/60">إجابتك:</p>
                    <p className={isCorrect ? 'text-green-700' : 'text-red-600'}>{studentAnswerLabel}</p>
                  </div>
                </div>
                {!isCorrect && (
                  <div className="bg-green-50 rounded-ruwad-sm p-3">
                    <p className="text-sm text-ruwad-navy/60">الإجابة الصحيحة:</p>
                    <p className="text-green-700">{correctAnswerLabel}</p>
                  </div>
                )}
              </>
            )}

            {q.explanation && (
              <div className="bg-ruwad-blue/5 rounded-ruwad-sm p-3">
                <p className="text-sm text-ruwad-navy/60 mb-1">الشرح:</p>
                <p className="text-sm text-ruwad-navy">{q.explanation}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
