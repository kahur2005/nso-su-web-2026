// lib/guidebook/quiz.ts
// Question text for the end-of-chapter guidebook quizzes.
//
// This module is imported by the client, so it deliberately holds NO answer
// key — the correct options live in ./answers.ts, which is server-only.
// Keeping the prompts here means the two files can never drift apart on
// wording; only the index of the right option is secret.

/** Points awarded for getting both of a chapter's questions right. */
export const POINTS_PER_CHAPTER = 2

export type QuizQuestion = {
  prompt: string
  options: string[]
}

/**
 * Keyed by the chapter ids used in app/(game)/info/guidebook/page.tsx.
 * Exactly two questions per chapter — the claim is all-or-nothing.
 */
export const QUIZZES: Record<string, [QuizQuestion, QuizQuestion]> = {
  talking: [
    {
      prompt:
        'Which platform does the guidebook call the most commonly used and preferred way to reach your lecturers?',
      options: ['WhatsApp', 'Microsoft Teams', 'Instagram DM', 'SMS'],
    },
    {
      prompt:
        'You are missing class for a competition. What must you attach to your email?',
      options: [
        'A screenshot of the event poster',
        'An official permission letter from the event',
        'Nothing, just explain in the email',
        'A doctor letter or statement',
      ],
    },
  ],
  'dos-donts': [
    {
      prompt: 'What does CLAYGO, one of the Rule 3 campus habits, stand for?',
      options: [
        'Clean As You Go',
        'Class Attendance Yearly Goal',
        'Clear All Your Group Obligations',
        'Come Late And You Get Out',
      ],
    },
    {
      prompt: 'According to the Player Don\'ts, how should you treat seniors at SU?',
      options: [
        'Always address them formally and never speak first',
        'Be intimidated, SU has a strict seniority system',
        'There is no seniority; they are there to guide and support you',
        'Avoid them until your second year',
      ],
    },
  ],
  'cv-interview': [
    {
      prompt: 'How early should you be prepared and on standby before an interview?',
      options: ['1 to 2 minutes', '10 to 15 minutes', '30 to 45 minutes', 'Exactly on time'],
    },
    {
      prompt: 'How should professional experience be ordered on your CV?',
      options: [
        'Alphabetically by organization',
        'Latest experience first, earliest below it',
        'Earliest experience first',
        'Longest duration first',
      ],
    },
  ],
  'ai-apps': [
    {
      prompt: 'Which tool is described as answering based on actual research papers?',
      options: ['Perplexity', 'Quillbot', 'Consensus', 'Grammarly'],
    },
    {
      prompt: "What is the guidebook's rule for using AI at SU?",
      options: [
        'AI is banned in every course',
        'AI supports you: check with lecturers, cite properly, and never let it replace your learning',
        'Use AI freely; Turnitin cannot detect it',
        'AI may only be used for coding',
      ],
    },
  ],
  'lms-portal': [
    {
      prompt:
        'Which platform do you use to submit assignments and read lecturer announcements?',
      options: ['The Student Portal', 'Canvas (LMS)', 'Bursary', 'SAA'],
    },
    {
      prompt: 'Where do you register for courses and view your academic transcript?',
      options: ['Canvas (LMS)', 'Microsoft Teams', 'The Student Portal', 'The library'],
    },
  ],
  services: [
    {
      prompt:
        'Which office issues academic transcripts and enrollment verification letters?',
      options: ['SPAC', 'Bursary', 'AR (Academic Registry)', 'SAA'],
    },
    {
      prompt: 'Who do you go to about tuition fees and instalment plans?',
      options: [
        'Bursary, on the 19th floor',
        'SPAC, inside the library',
        'SAA, on the 6th floor',
        'Your course lecturer',
      ],
    },
  ],
  freshman: [
    {
      prompt: 'What does the guidebook advise about credits (SKS) when choosing electives?',
      options: [
        'Take the maximum every semester',
        "Don't load up on too many, leave room for activities and rest",
        'Only take electives in your final year',
        "A course's credit weight doesn't matter",
      ],
    },
    {
      prompt: 'What is the recommended way to handle your allowance?',
      options: [
        'Spend first and save whatever is left',
        'Keep it in one account and track nothing',
        'Split it into pockets (needs, savings, entertainment) as soon as it arrives',
        'Put all of it into investments',
      ],
    },
  ],
  transportation: [
    {
      prompt: 'What is the minimum card balance required for the MRT and LRT?',
      options: ['Rp5,000', 'Rp10,000', 'Rp20,000', 'Rp50,000'],
    },
    {
      prompt: 'Which two busway stops are closest to campus?',
      options: [
        'Perdatam and Tria Dipa',
        'Manggarai and UI',
        'Ps. Minggu and Tanah Abang',
        'Pancoran Bank BJB and Cawang',
      ],
    },
  ],
}

/**
 * Display names for the chapter ids, so the profile activity log can label a
 * claim without importing the whole guidebook page.
 */
export const CHAPTER_TITLES: Record<string, string> = {
  talking: 'How to Talk to People in SU',
  'dos-donts': "Do's and Don'ts as an SU Student",
  'cv-interview': 'CV & Interview',
  'ai-apps': 'AI & Apps',
  'lms-portal': 'LMS / Student Portal',
  services: 'Academic & Non-Academic Services',
  freshman: 'Freshman Tips',
  transportation: 'Transportation',
}

export const QUIZ_CHAPTER_IDS = Object.keys(QUIZZES)

/** 8 chapters × 2 points — the ceiling quoted to students. */
export const MAX_GUIDEBOOK_POINTS = QUIZ_CHAPTER_IDS.length * POINTS_PER_CHAPTER
