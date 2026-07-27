// lib/guidebook/answers.ts
// SERVER ONLY. The correct option index for each guidebook quiz question.
//
// Never import this from a `'use client'` file or anything one reaches — the
// whole point of splitting it away from ./quiz.ts is that the answers must not
// ship in the browser bundle, or a student can read them out of the JS and
// claim all 16 points without opening the book. Grading happens in
// app/api/guidebook/quiz/route.ts and nowhere else.
//
// The repo has no `server-only` package, so this throws instead: if the module
// is ever pulled into a client bundle the page breaks loudly at import time
// rather than silently leaking the key.
if (typeof window !== 'undefined') {
  throw new Error(
    'lib/guidebook/answers.ts was imported into a client bundle — the quiz answer key must stay on the server.',
  )
}

import { QUIZZES } from './quiz'

/** Index into the matching question's `options` array. */
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

/**
 * True only when both answers match the key. Anything malformed — unknown
 * chapter, wrong number of answers, a non-integer, an out-of-range index —
 * grades as incorrect rather than throwing, so a hand-crafted request can
 * never earn points but still burns the single attempt.
 */
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
