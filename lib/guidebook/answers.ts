// Server-only quiz answers. Do not import in client components.
if (typeof window !== 'undefined') {
  throw new Error(
    'lib/guidebook/answers.ts was imported into a client bundle — the quiz answer key must stay on the server.',
  )
}

import { QUIZZES } from './quiz'

/** Correct option index for each chapter question. */
export const ANSWER_KEY: Record<string, [number, number]> = {
  talking: [1, 1],
  'dos-donts': [0, 2],
  'cv-interview': [1, 1],
  'ai-apps': [2, 1],
  'lms-portal': [1, 2],
  services: [2, 0],
  freshman: [1, 2],
  transportation: [2, 0],
}

/** Validate chapter answers against the answer key. Return true if all match. */
export function gradeChapter(chapterId: string, answers: unknown): boolean {
  const key = ANSWER_KEY[chapterId]
  const questions = QUIZZES[chapterId]
  if (!key || !questions) return false
  if (!Array.isArray(answers) || answers.length !== key.length) return false

  return key.every((correct, i) => {
    const given = answers[i]
    if (typeof given !== 'number' || !Number.isInteger(given)) return false
    if (given < 0 || given >= questions[i].options.length) return false
    return given === correct
  })
}
