'use client'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import ChapterQuiz, { type Attempt } from '@/components/guidebook/ChapterQuiz'
import { QUIZZES, MAX_GUIDEBOOK_POINTS } from '@/lib/guidebook/quiz'
import { cqw, TYPE } from '@/lib/guidebook/scale'

/* ── Design tokens ───────────────────────────────────────────────────────── */

const TINT = {
  green: 'rgba(101,198,54,0.41)',
  red: 'rgba(242,93,93,0.36)',
  yellow: 'rgba(252,249,64,0.46)',
  blue: 'rgba(64,196,255,0.36)',
  purple: 'rgba(171,71,188,0.33)',
  paper: 'rgba(255,255,255,0.55)',
} as const

const INK_TITLE = '#3e2218'
const INK_BODY = '#5d3a20'
const INK_PAGER = '#63482f'

const PAGE = {
  contentLeft: '7.2%',
  contentRight: '20%',
  bookmarkRight: '0%',
}

const RIBBON_H = 25
const RIBBON_PAD_Y = 8.5

const BOOKMARK = {
  w: '34px',
  activeW: '43px',
  hoverW: '40px',
  h: `${RIBBON_H}px`,
  padY: `${RIBBON_PAD_Y}px`,
  totalH: `${RIBBON_H + RIBBON_PAD_Y * 2}px`,
  gap: '0px',
} as const

type Section = {
  title: string
  tint: string
  body?: string[]
  items?: string[]
  rows?: { label: string; detail: string }[]
  template?: string[]
  image?: { src: string; alt: string }
}

type GuidePage = {
  sections: Section[]
  notes?: string[]
}

type Chapter = {
  id: string
  title: string
  bookmark: { light: string; dark: string }
  pages: GuidePage[]
}

const chapters: Chapter[] = [
  /* ── 1 ──────────────────────────────────────────────────────────────── */
  {
    id: 'talking',
    title: 'How to Talk to People in SU',
    bookmark: { dark: '#311b92', light: '#0d47a1' },
    pages: [
      {
        sections: [
          {
            title: 'How To Talk To\nPeople in SU',
            tint: TINT.green,
            items: [
              "Maintain positive body language and don't forget to smile!",
              'Introduce yourself with confidence.',
              'Be open-minded when meeting new people.',
              'Listen actively in conversations and show genuine interest.',
              'Show gratitude by saying "please" and "thank you".',
              'Treat everyone equally, regardless of their background, age, or achievements.',
            ],
          },
          {
            title: 'How NOT To Talk To\nPeople in SU',
            tint: TINT.red,
            items: [
              'Avoid making offensive jokes about race, religion, gender, or culture.',
              "Respect people's privacy instead of pressuring them to share personal information.",
              'Stay away from gossiping or spreading rumors.',
              'Refrain from interrupting people if not necessary.',
              'Never act superior or compare yourself to others.',
              'Avoid excluding others from conversations or group activities.',
              'Own up to your own mistakes and apologize when necessary.',
            ],
          },
        ],
        notes: [
          "Remember that everyone is new at some point, so don't be afraid to start conversations.",
          'Building friendships takes time — small and consistent interactions matter the most.',
        ],
      },
      {
        sections: [
          {
            title: 'Where To Contact',
            tint: TINT.blue,
            rows: [
              {
                label: 'Microsoft Teams',
                detail:
                  'Most commonly used and preferred platform to reach out to your lecturers.',
              },
              {
                label: 'Email',
                detail:
                  'Can be used to contact your lecturers, other university departments, and staff members.',
              },
              {
                label: 'WhatsApp',
                detail:
                  'Alternative to contact your lecturers or other members of staff. Note that not all lecturers and staff members are open to students contacting them this way.',
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'How To Write A\nProper Email',
            tint: TINT.yellow,
            rows: [
              {
                label: 'Use a clear subject line',
                detail:
                  'Make it easy for your lecturer to know what the email is about (e.g. "Question About Week 3 Lecture" or "Assignment 2 Clarification").',
              },
              {
                label: 'Start with a polite greeting',
                detail:
                  'Use a respectful greeting such as "Dear Professor [Last Name]" or "Dear Sir [Last Name]".',
              },
              {
                label: 'Introduce yourself',
                detail:
                  'State your name, course, and class — for example, "My name is John Doe, and I am a student in your Mechanical Engineering class".',
              },
              {
                label: "Explain why you're emailing",
                detail:
                  'Clearly state the purpose of your email (e.g. "I am writing to ask about…").',
              },
              {
                label: 'Be polite',
                detail:
                  'Use respectful language such as "please", "thank you", and "I would appreciate it if…".',
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'How To Write A\nProper Email',
            tint: TINT.yellow,
            rows: [
              {
                label: 'Mention your availability (if necessary)',
                detail:
                  "If you are asking to meet with your lecturer, let them know when you're available.",
              },
              {
                label: 'Use professional closings',
                detail:
                  'End with "Kind regards", "Best regards", or "Sincerely", followed by your full name.',
              },
              {
                label: 'Proofread before sending',
                detail:
                  'Check for spelling, grammar, and typing mistakes before you hit send.',
              },
              {
                label: 'Attach files (if needed)',
                detail:
                  "If you are referring to an assignment, report, or other document, make sure you've attached it before sending.",
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Emailing A\nLecturer',
            tint: TINT.blue,
            template: [
              'Dear [Lecturer Name],',
              '',
              'I hope this email finds you well. My name is [Your Name], and I am currently enrolled in your [Your Class] course. I am writing to seek clarification regarding the due date for the cognitive theories assignment discussed in Monday\'s lecture.',
              '',
              'Could you kindly confirm whether the assignment is due on Monday or Wednesday of next week? I wish to ensure that my submission is timely and in accordance with the course requirements.',
              '',
              'Thank you very much for your assistance.',
              '',
              'Best regards,',
              '[Your Name]',
              '[Major + Cohort]',
              '[Student ID]',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Requesting\nLab Usage',
            tint: TINT.green,
            template: [
              'Subject: Request for Laboratory Use on [day], [time]',
              '',
              'Good afternoon [Name of person you are contacting],',
              '',
              'I hope this email finds you well. My name is [Your Name] from the [course name and section], cohort [your cohort]. I am writing to kindly request permission to use the laboratory on [date], from [start time] to [ending time].',
              '',
              'We plan to conduct [experiment or assignment] and would greatly appreciate your approval to access the lab during that time.',
              '',
              'Thank you very much for your attention to this request. I look forward to your response.',
              '',
              'Sincerely,',
              '[Your Name]',
              '[Major + Cohort]',
              '[Student ID]',
            ],
          },
        ],
        notes: [
          "After receiving the lab assistant's approval, you must complete a logbook listing the equipment, materials, and procedures to be conducted. The template is provided by the lab assistant.",
        ],
      },
      {
        sections: [
          {
            title: 'Emailing SAA',
            tint: TINT.purple,
            template: [
              'Dear [name of person you are trying to contact],',
              '',
              'I am [your name] from [major + cohort], and I would like to request to book a class on the [which floor] for [reason of booking]. Below are the details:',
              '',
              'Time:',
              'Day/Date:',
              'Location: [which floor] classroom, preferably [preferred room]',
              '',
              'Please let me know if this is possible or not, thank you!',
              '',
              'Best regards,',
              '[Your Name]',
              '[Major + Cohort]',
              '[Student ID]',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Text Message\n(Teams / WA)',
            tint: TINT.blue,
            template: [
              'Good afternoon, [Lecturer Name],',
              '',
              'I am [Your Name] from Cohort [Your Cohort]. I apologize for any inconvenience, but I would like to consult with you regarding my midterm essay. Since today is the last day for consultations before the submission deadline next week, would it be possible to send my essay file here for your feedback?',
              '',
              'Thank you very much for your time and assistance.',
              '',
              'Best regards,',
              '[Your Name]',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Permission Letter',
            tint: TINT.red,
            body: ['For a committee event, a competition, or sick leave.'],
            template: [
              'Good morning, [name of the person you want to contact],',
              '',
              "I hope you are doing well. I'm [your name], currently enrolled in [Class name – Section (A, B, or C)].",
              '',
              "I'm writing this email to inform you about my attendance — I couldn't join [today / tomorrow / the date] due to [event, competition, or sickness].",
              '',
              'In this email I have also attached the official permission letter from [the event name, competition, or doctor/hospital].',
              '',
              'Thank you for your attention. Hope you have a great day, [your lecturer name].',
              '',
              'Regards,',
              '[Your Name]',
            ],
          },
        ],
        notes: [
          'An event or competition needs an official permission letter; sick leave needs an official doctor letter or statement.',
        ],
      },
    ],
  },

  /* ── 2 ──────────────────────────────────────────────────────────────── */
  {
    id: 'dos-donts',
    title: "Do's and Don'ts as an SU Student",
    bookmark: { dark: '#2e7d32', light: '#4caf50' },
    pages: [
      {
        sections: [
          {
            title: "The SU Player's\nManual",
            tint: TINT.blue,
            body: [
              'Welcome, Player 1, to the Sampoerna University (SU) server! Your collegiate journey is an open-world adventure filled with main quests, skill trees, and co-op missions. To ensure a smooth playthrough and avoid triggering a "Game Over", please review the official rules of the game.',
            ],
          },
          {
            title: 'Rule 1:\nThe Moral Code',
            tint: TINT.green,
            body: [
              'To build a strong reputation in the SU Guild, all players must equip the following core values:',
            ],
            items: [
              'Compassion & Kindness: treat others with empathy, support your peers, and protect your community from harm.',
              'Fairness & Equity: follow the golden rule by treating everyone the way you want to be treated!',
              'Solidarity & Loyalty: support fellow students and create a warm, welcoming campus community where everyone feels they belong.',
              'Honesty & Trust: speak the truth, keep your promises, and remain accountable for your actions.',
              'Respect & Inclusivity: embrace diversity. Never make inconsiderate jokes regarding religion, gender, race, or background.',
              "Build Meaningful Connections: university isn't just about earning a degree — it's about creating connections, building friendships, learning from one another, and becoming part of a supportive community.",
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Rule 2:\nThe Scholar's Quest",
            tint: TINT.blue,
            items: [
              "Maintain Academic Integrity: use A.I. and online resources responsibly. Avoid any form of plagiarism, cheating, falsifying data, or submitting work that isn't genuinely your own.",
              'Embrace Scientific Values: approach your studies with an open, critical, and objective mind.',
              'Respect Faculty & Staff: show respect toward lecturers, administrators, and campus support staff, in person, through email, and in online class or project discussions.',
              'Master Time Management: keep track of your syllabus and submit all assignments before the deadline.',
              "Commit to Learning: attend classes consistently, stay curious, be attentive, and don't hesitate to ask questions.",
              'Communicate Professionally: whether through emails, group chats, or in person, communicate respectfully with lecturers, staff, and fellow students.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Rule 3: Maximize Campus\nLife & Resources',
            tint: TINT.yellow,
            items: [
              'Utilize SU Facilities: take full advantage of the resources available to you, including the library, academic tutoring, career services, and campus counselors.',
              'Practice CLAYGO (Clean As You Go): keep campus common areas, classrooms, and cafeterias clean and safe for everyone.',
              'Dress Appropriately: follow the campus dress code by wearing smart-casual attire suitable for an academic environment.',
              'Own Your Potential: believe in your abilities, step out of your comfort zone, and explore organizations, competitions, volunteering, and leadership programs that align with your interests and goals.',
              'Ask for Help When Needed: reach out to peers, lecturers, or student services whenever you feel overwhelmed academically or personally.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'The Permabans\n& Debuffs',
            tint: TINT.red,
            body: ["Player don'ts."],
            items: [
              'Stand by your principles: whether on or off campus, your actions represent both yourself and the SU community as a whole.',
              "Don't do drugs, consume alcohol, or smoke: SU maintains a strict substance-free campus policy to ensure a healthy learning environment.",
              "Don't spread misleading information: avoid sharing rumors, gossip, or unverified claims on social media about campus life, staff, or fellow students.",
              "Don't be intimidated by seniors: there is no seniority at SU. Seniors are here to guide, support, and cheer you on.",
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'The Permabans\n& Debuffs',
            tint: TINT.red,
            items: [
              "Don't burn yourself out: while academics are important, don't forget to have fun, make friends, and enjoy the college experience. College is a marathon, not a sprint.",
              "Don't forget to show gratitude: always show gratitude to the people around you, from the janitorial staff to your professors and teammates. A little gratitude goes a long way!",
              "Don't overcommit: it's exciting to try new things, but avoid putting more on your plate than you can take. Balance academics, extracurriculars, and personal well-being.",
              "Don't compare your journey to others: everyone goes at their own pace. Focus on your own growth instead of comparing grades, achievements, or experiences.",
            ],
          },
        ],
      },
    ],
  },

  /* ── 3 ──────────────────────────────────────────────────────────────── */
  {
    id: 'cv-interview',
    title: 'CV & Interview',
    bookmark: { dark: '#f9a825', light: '#fcf940' },
    pages: [
      {
        sections: [
          {
            title: 'Interview Tips',
            tint: TINT.yellow,
            rows: [
              {
                label: '1. Always be on time!!',
                detail:
                  'Be prepared and on standby at least 10–15 minutes before the interview time. Check your camera, your mic, and yourself.',
              },
              {
                label: '2. Dress accordingly',
                detail:
                  'For a formal (work-related) interview, wear a shirt or other non-informal clothes. For a semi-formal interview a t-shirt is fine. Note: avoid overly open clothing such as tank tops or boxers, tidy your hair, and look neat.',
              },
              {
                label: '3. Be informed and knowledgeable',
                detail:
                  'Analyze the position thoroughly — what it does and what its responsibilities are. Read the guidebook properly, ask the contact person about the event and role before applying, and research further with a senior or lecturer if needed.',
              },
              {
                label: '4. Trust yourself and be confident',
                detail:
                  "Prepare mentally and focus. Don't let nervousness disrupt your flow of talking and thinking. Note: if you feel unfocused, keep paper and pen to write the question down so your answer stays in context.",
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Interview Tips',
            tint: TINT.yellow,
            rows: [
              {
                label: '5. Acquire knowledge about the interview',
                detail:
                  'Ask friends and seniors about their previous experience of the interview — which questions came up, and how they recommend responding.',
              },
              {
                label: '6. Be respectful',
                detail:
                  'Be mindful of how you respond and what language you use. Avoid vulgar or otherwise bad language. Note: stay formal even if the interviewer is someone you know well.',
              },
              {
                label: '7. Show interest',
                detail:
                  "Don't hesitate to ask questions about the event, the organization, or your role — it shows you are interested and want to learn more.",
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'How To Build\nYour CV',
            tint: TINT.green,
            body: ['CV structure:'],
            items: [
              'Your name',
              'Email, phone number, and location',
              'About yourself (briefly, 100–200 words)',
              'Education',
              'Hard skills and soft skills',
              'Professional experience — usually split into work experience, organization experience, and volunteer experience',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Writing Each\nSection',
            tint: TINT.blue,
            rows: [
              {
                label: 'About yourself',
                detail:
                  'Start with a short introduction — your name, year, and major — then your skills, your interests, and what you are passionate about.',
              },
              {
                label: 'Professional experience',
                detail:
                  'Open with [Company / event / organization name], [City, Country]. On the next line put [the division or role you took on], [duration from start to finish]. Below those two lines, write what you worked on and the result.',
              },
              {
                label: 'Example result lines',
                detail:
                  '"Gather and manage 500 ompreng MBG at once." · "Coordinate and provide the location to send MBG to school."',
              },
              {
                label: 'Ordering',
                detail:
                  'Arrange each professional section with the latest experience first and the earliest below it.',
              },
            ],
          },
        ],
        notes: ['Use professional wording rather than casual or informal wording.'],
      },
    ],
  },

  /* ── 4 ──────────────────────────────────────────────────────────────── */
  {
    id: 'ai-apps',
    title: 'AI & Apps',
    bookmark: { dark: '#6a1b9a', light: '#ab47bc' },
    pages: [
      {
        sections: [
          {
            title: 'AI & Apps For College —\nUse Them Wisely',
            tint: TINT.purple,
            body: [
              'AI is just a tool to help, not to replace your thinking.',
              "Some lecturers still don't allow AI usage. Always check first, and prioritize academic integrity.",
            ],
          },
          {
            title: 'Finding References\n& Journals',
            tint: TINT.blue,
            rows: [
              {
                label: 'Consensus',
                detail:
                  'Answers based on actual research papers — great for scientific claims and evidence.',
              },
              { label: 'Google Scholar', detail: 'Search for journals, cite automatically.' },
              { label: 'JSTOR', detail: 'Find full academic papers (limited free access).' },
              {
                label: 'Perplexity',
                detail: 'Fast Q&A search with sources — not always accurate, so double-check.',
              },
              {
                label: 'Scite',
                detail:
                  'Shows how papers are cited, supporting or contradicting — great for evaluating credibility.',
              },
            ],
          },
        ],
        notes: [
          'You can always visit the library — it has built-in resources for finding references.',
        ],
      },
      {
        sections: [
          {
            title: 'Writing &\nEditing Tools',
            tint: TINT.green,
            rows: [
              {
                label: 'ChatGPT',
                detail:
                  'Review material, create summaries, outlines, even mock essays. Use responsibly — always paraphrase and cite.',
              },
              { label: 'Deepseek, Gemini, Claude', detail: 'Substitutes for ChatGPT.' },
              { label: 'Grammarly', detail: 'Checks grammar, clarity, and tone.' },
              { label: 'Turnitin', detail: 'Plagiarism and AI-content detection.' },
              {
                label: 'Quillbot',
                detail:
                  "Paraphrasing and summarizing. Use with caution — don't lose the original meaning.",
              },
              { label: 'Zotero / Mendeley', detail: 'Manage citations and references like a pro.' },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Research &\nOrganization',
            tint: TINT.yellow,
            rows: [
              { label: 'Miro', detail: 'Brainstorming, mind mapping, real-time collaboration.' },
              { label: 'Notion', detail: 'Manage tasks, lecture notes, and projects.' },
            ],
          },
          {
            title: 'Design &\nPresentation',
            tint: TINT.purple,
            rows: [
              {
                label: 'Flaticon',
                detail: 'Icons and free graphic elements — check if attribution is needed.',
              },
              {
                label: 'Remove.bg',
                detail: 'Remove image backgrounds instantly for posters, slides, or design.',
              },
              {
                label: 'Slidesgo',
                detail:
                  'Clean free and premium templates for Google Slides or PowerPoint — credit may be required.',
              },
            ],
          },
          {
            title: 'File Management',
            tint: TINT.blue,
            rows: [
              {
                label: 'iLovePDF',
                detail:
                  'Merge PDFs, remove pages, compress files, and convert between formats (Word ↔ PDF, JPG ↔ PDF).',
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Programming',
            tint: TINT.green,
            rows: [
              {
                label: 'GitHub Copilot',
                detail:
                  'AI autocomplete for code in VS Code. Fast and helpful, but make sure you understand the output.',
              },
              {
                label: 'Cursor',
                detail:
                  'AI-powered code editor. Chat with your code, fix bugs, and generate files instantly.',
              },
              {
                label: 'Programiz',
                detail:
                  'Write and run code in your browser for quick testing (Python, Java, C, and more).',
              },
              {
                label: 'Claude AI',
                detail:
                  'Excels at coding as well as analysis; can process complex and massive data at once.',
              },
              {
                label: 'VS Code',
                detail: 'Versatile code editor with plugin support, including Copilot.',
              },
            ],
          },
        ],
        notes: [
          'Different compilers or platforms may give slightly different outputs. Always test your code and make sure you understand it.',
          "AI is powerful, but always double-check, cite properly, and don't rely on it to do your learning. Misusing paraphrasers or AI writers to fool Turnitin, or submitting AI-generated work as your own, can violate academic policies.",
        ],
      },
    ],
  },

  /* ── 5 ──────────────────────────────────────────────────────────────── */
  {
    id: 'lms-portal',
    title: 'LMS / Student Portal',
    bookmark: { dark: '#0277bd', light: '#40c4ff' },
    pages: [
      {
        sections: [
          {
            title: 'LMS (Canvas)',
            tint: TINT.blue,
            body: [
              "Canvas is the university's Learning Management System and the primary platform for academic activities. Use Canvas to:",
            ],
            items: [
              'Access course materials, lecture slides, and learning modules.',
              'Submit assignments and complete quizzes or examinations.',
              'View course announcements and updates from lecturers.',
              'Participate in discussion forums and other online learning activities.',
              'Monitor assignment deadlines and course grades.',
            ],
            image: { src: '/images/guidebook/lms-canvas.png', alt: 'Canvas LMS home page' },
          },
        ],
      },
      {
        sections: [
          {
            title: 'Student Portal',
            tint: TINT.green,
            body: [
              "The Student Portal is the university's academic information system, used for administrative and academic purposes. Use the portal to:",
            ],
            items: [
              'View semester grades and academic transcripts.',
              'View your degree plan (curriculum).',
              'Register for courses during the course enrollment period.',
              'Complete post-teaching verification and other required academic evaluations.',
              'Access essential academic records and student services provided by the university.',
            ],
            image: {
              src: '/images/guidebook/student-portal.png',
              alt: 'Sampoerna University Student Portal',
            },
          },
        ],
      },
    ],
  },

  /* ── 6 ──────────────────────────────────────────────────────────────── */
  {
    id: 'services',
    title: 'Academic & Non-Academic Services',
    bookmark: { dark: '#00695c', light: '#26a695' },
    pages: [
      {
        sections: [
          {
            title: '🎓 Academic\nServices',
            tint: TINT.green,
            rows: [
              {
                label: 'SPAC — Student Parent Academic Counselor',
                detail:
                  'Academic guidance and support throughout your study period: course planning, consultation on academic performance or grade concerns, help when an academic issue cannot be resolved with the course lecturer, and guidance if you are considering a change of major.',
              },
              {
                label: 'AR — Academic Registry',
                detail:
                  'Academic administration and official documentation: academic transcripts, enrollment verification letters, and other official academic documents.',
              },
            ],
          },
        ],
        notes: [
          'SPAC is inside the library, on the 6th floor.',
          'AR is on the 19th floor — left of the elevator hall, then on the right, in front of class 19F-19.',
        ],
      },
      {
        sections: [
          {
            title: '📋 Non-Academic\nServices',
            tint: TINT.purple,
            rows: [
              {
                label: 'Bursary',
                detail:
                  'Financial and tuition matters: tuition fee inquiries, payment procedures, and instalment or payment-plan requests for students who need more financial flexibility.',
              },
              {
                label: 'SAA — Student Alumni Affairs',
                detail:
                  'Student life outside the classroom: student organizations, campus events, leadership opportunities, internships, and alumni relations. SAA also handles borrowing the university alma mater jacket, and provides extracurricular information and career development services.',
              },
            ],
          },
        ],
        notes: [
          'Bursary is on the 19th floor.',
          'SAA is on the 6th floor — the office on the right side as you come from the lift.',
        ],
      },
    ],
  },

  /* ── 7 ──────────────────────────────────────────────────────────────── */
  {
    id: 'freshman',
    title: 'Freshman Tips',
    bookmark: { dark: '#bf360c', light: '#f4511e' },
    pages: [
      {
        sections: [
          {
            title: 'Culture Shocks',
            tint: TINT.yellow,
            items: [
              'More freedom and flexible scheduling, but also far more personal responsibility.',
              'Stepping out of your comfort zone becomes something you have to do far more often than before.',
              "There is a lot to adjust to in the transition period, so get to know your seniors! We're approachable and willing to help, so don't be afraid to reach out.",
            ],
          },
          {
            title: 'Homesickness &\nFeeling Overwhelmed',
            tint: TINT.blue,
            items: [
              'Consistently contact your family and friends through video calls.',
              'Finding comfort food helps more than expected.',
              'Give yourself a stress outlet — exercise, a hobby, journaling, resting.',
              'If distance allows, go home on weekends to rest and see family.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Study Habits &\nTime Management',
            tint: TINT.green,
            items: [
              'Do the most urgent thing first.',
              'Use small gaps between classes for quick tasks, not your phone.',
              'Reward yourself after finishing tasks to stay motivated.',
              'Find the study method that suits you — everyone has different preferences.',
              'Studying with people who keep you accountable makes consistency easier; combine studying and socializing where you can.',
            ],
          },
          {
            title: 'Choosing Electives',
            tint: TINT.purple,
            items: [
              "Be alert during registration periods — sleeping in can land you in classes you didn't want.",
              'Do not load up on too many credits (SKS); leave room for activities and rest.',
              "Research a course's workload and difficulty before enrolling, and know each course's credit weight so you can prioritize.",
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "What's Actually\nWorth It?",
            tint: TINT.yellow,
            rows: [
              {
                label: 'Most commonly wasted on',
                detail:
                  'Food delivery and eating out, impulse hobby purchases, and FOMO-driven outings.',
              },
              {
                label: 'Worth buying instead',
                detail:
                  'Daily-use items (laptop stand, mouse, earphones, water bottle), dorm essentials (cookware, cutlery, blanket, umbrella), a power bank if you commute, and an e-money/TJ card.',
              },
            ],
          },
          {
            title: 'Allocating Your\nAllowance',
            tint: TINT.green,
            items: [
              'Split your allowance into categories or "pockets" (needs, savings, entertainment) as soon as it arrives, rather than spending first and saving what is left.',
              'Immediately move a portion straight into savings or small investments before you spend it.',
              'Track spending with a spreadsheet or an app, or set a firm budget.',
              'Favor public transit (TJ / transum) over ride-hailing apps to keep daily costs down.',
              'Cheap food: PanBar (Pancoran Barat), Oma Lieke, and Warteg B1.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Final Thoughts',
            tint: TINT.blue,
            body: [
              "University is one of the few stages in life surrounded by countless chances to learn, fail, meet new people, and discover who you are. Some of the most valuable things you gain won't show up on a transcript — they come from the people you meet, the challenges you overcome, and the mistakes you learn from. Your GPA matters, but it's only one part of the journey.",
            ],
          },
        ],
      },
    ],
  },

  /* ── 8 ──────────────────────────────────────────────────────────────── */
  {
    id: 'transportation',
    title: 'Transportation',
    bookmark: { dark: '#33691e', light: '#7cb342' },
    pages: [
      {
        sections: [
          {
            title: 'Getting Around',
            tint: TINT.green,
            items: [
              'Use Google Maps, Moovit, or the TJ app, and get an e-money/TJ card.',
              'Recommended cards: e-money (Mandiri), Flazz (BCA), or Brizzi (BRI) — pick based on your bank.',
              "For longer distances: KRL, MRT, and LRT — there's an LRT close to our campus!",
            ],
          },
        ],
        notes: [
          'Cards issued by Bank DKI can only be used for Transjakarta — not for toll roads or parking.',
        ],
      },
      {
        sections: [
          {
            title: 'Stops Near\nCampus',
            tint: TINT.blue,
            items: [
              'Closest busway stops: Perdatam (near the BPJS office) and Tria Dipa (in front of Mixue).',
              'Both are served by bus 9D (Ps. Minggu – Tanah Abang) and 4B (Manggarai – UI), in both directions.',
              'Closest LRT station: Pancoran Bank BJB.',
            ],
          },
        ],
        notes: ['MRT and LRT require a minimum card balance of Rp20,000.'],
      },
    ],
  },
]

/* ── UI Logic ────────────────────────────────────────────────────────── */

export default function GuideBookPage() {
  const [chapterIdx, setChapterIdx] = useState(0)
  const [pageIdx, setPageIdx] = useState(0)

  const chapter = chapters[chapterIdx]
  const totalPages = chapter.pages.length
  const page = chapter.pages[pageIdx]

  const [attempts, setAttempts] = useState<Record<string, Attempt>>({})
  const [attemptsLoaded, setAttemptsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/guidebook/quiz')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then((data) => {
        if (cancelled) return
        const next: Record<string, Attempt> = {}
        for (const a of data.attempts ?? []) next[a.chapterId] = a
        setAttempts(next)
        setAttemptsLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setAttemptsLoaded(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const recordAttempt = useCallback((attempt: Attempt) => {
    setAttempts((prev) => ({ ...prev, [attempt.chapterId]: attempt }))
  }, [])

  const claimedPoints = Object.values(attempts).reduce(
    (sum, a) => sum + (a.claimedAt ? a.pointsAwarded : 0),
    0,
  )

  const isLastPage = pageIdx === totalPages - 1
  const quiz = QUIZZES[chapter.id]

  const openChapter = (idx: number) => {
    setChapterIdx(idx)
    setPageIdx(0)
  }

  return (
    <PageWrapper>
      <div className="relative game-column pb-4 pt-8">
        {/* Page Title */}
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.6rem,16vw,4rem)] leading-[0.9]">
          GUIDEBOOK
        </h1>

        <p
          className="mt-1 text-center font-bytebounce text-[20px] leading-tight"
          style={{ color: '#ffecb3', textShadow: '2px 2px 0 #3e2723' }}
        >
          {chapter.title}
        </p>

        {attemptsLoaded && (
          <p
            className="mt-0.5 text-center font-bytebounce text-[19px] leading-tight"
            style={{ color: '#ffd23f', textShadow: '1.5px 1.5px 0 #3e2723' }}
          >
            Quiz points: {claimedPoints}/{MAX_GUIDEBOOK_POINTS}
          </p>
        )}

        {/* Book Container */}
        <div
          className="relative mt-3 -mx-3 max-w-[448px] sm:mx-auto"
          style={{ containerType: 'inline-size' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guidebook/book-top.png" alt="" aria-hidden className="block w-full" />

          <div
            className="relative -my-px"
            style={{
              backgroundImage: 'url(/images/guidebook/book-page.png)',
              backgroundRepeat: 'repeat-y',
              backgroundSize: '100% auto',
            }}
          >
            {/* Navigation Tabs */}
            <div
              className="absolute z-20 flex flex-col"
              style={{ right: PAGE.bookmarkRight, top: cqw(32), gap: BOOKMARK.gap }}
              role="tablist"
              aria-label="Guide book chapters"
            >
              {chapters.map((entry, idx) => {
                const isActive = idx === chapterIdx
                return (
                  <button
                    key={entry.title}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={entry.title}
                    title={entry.title}
                    onClick={() => openChapter(idx)}
                    className={`box-border w-[var(--ribbon-w)] transition-all duration-150 ${
                      isActive
                        ? 'brightness-110'
                        : 'brightness-90 hover:w-[var(--ribbon-hover-w)] hover:brightness-105'
                    }`}
                    style={
                      {
                        backgroundImage: `linear-gradient(90deg, ${entry.bookmark.dark} 0 28%, ${entry.bookmark.light} 28% 100%)`,
                        backgroundClip: 'content-box',
                        height: BOOKMARK.totalH,
                        paddingTop: BOOKMARK.padY,
                        paddingBottom: BOOKMARK.padY,
                        '--ribbon-w': isActive ? BOOKMARK.activeW : BOOKMARK.w,
                        '--ribbon-hover-w': BOOKMARK.hoverW,
                      } as CSSProperties
                    }
                  />
                )
              })}
            </div>

            {/* Page content */}
            <div
              className="relative z-10 flex flex-col"
              style={{
                paddingLeft: PAGE.contentLeft,
                paddingRight: PAGE.contentRight,
                paddingTop: cqw(16),
                paddingBottom: cqw(16),
                gap: cqw(12),
                minHeight: cqw(420),
              }}
            >
              {page.sections.map((section, sIdx) => (
                <section
                  key={`${section.title}-${sIdx}`}
                  style={{
                    backgroundColor: section.tint,
                    borderRadius: cqw(11),
                    padding: `${cqw(10)} ${cqw(8)}`,
                  }}
                >
                  <h2
                    className="whitespace-pre-line text-center font-bytebounce leading-[0.78]"
                    style={{ color: INK_TITLE, fontSize: cqw(30, TYPE) }}
                  >
                    {section.title}
                  </h2>

                  {section.body?.map((para) => (
                    <p
                      key={para}
                      className="font-bytebounce leading-[1.05]"
                      style={{ color: INK_BODY, fontSize: cqw(20, TYPE), marginTop: cqw(7) }}
                    >
                      {para}
                    </p>
                  ))}

                  {section.items && (
                    <ol
                      className="list-decimal font-bytebounce leading-[1.05]"
                      style={{
                        color: INK_BODY,
                        fontSize: cqw(20, TYPE),
                        marginTop: cqw(7),
                        paddingInlineStart: cqw(26),
                      }}
                    >
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  )}

                  {section.rows && (
                    <dl
                      className="font-bytebounce leading-[1.05]"
                      style={{ fontSize: cqw(20, TYPE), marginTop: cqw(7) }}
                    >
                      {/* The margin is inline, so it beats a `first:mt-0`
                          class — the first row has to be zeroed here instead. */}
                      {section.rows.map((row, rIdx) => (
                        <div key={row.label} style={{ marginTop: rIdx === 0 ? 0 : cqw(7) }}>
                          <dt style={{ color: INK_TITLE, fontSize: cqw(21, TYPE) }}>{row.label}</dt>
                          <dd style={{ color: INK_BODY, paddingInlineStart: cqw(12) }}>
                            {row.detail}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {section.template && (
                    <div
                      className="font-bytebounce leading-[1.1]"
                      style={{
                        backgroundColor: TINT.paper,
                        color: INK_BODY,
                        fontSize: cqw(19, TYPE),
                        marginTop: cqw(8),
                        borderRadius: cqw(8),
                        padding: `${cqw(8)} ${cqw(10)}`,
                      }}
                    >
                      {section.template.map((line, i) =>
                        line === '' ? (
                          <div key={i} aria-hidden style={{ height: cqw(10) }} />
                        ) : (
                          <p key={i}>{line}</p>
                        ),
                      )}
                    </div>
                  )}

                  {section.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.image.src}
                      alt={section.image.alt}
                      className="w-full border-2 border-[#8d6e63]"
                      style={{ imageRendering: 'auto', marginTop: cqw(8), borderRadius: cqw(6) }}
                    />
                  )}
                </section>
              ))}

              {/* End-of-chapter quiz — last page only. Hidden until the
                  attempt list has loaded, so a student can never burn their
                  single try against a server that would not record it. */}
              {isLastPage && quiz && attemptsLoaded && (
                <ChapterQuiz
                  chapterId={chapter.id}
                  questions={quiz}
                  attempt={attempts[chapter.id] ?? null}
                  onAttemptChange={recordAttempt}
                />
              )}

              {page.notes && (
                <section
                  style={{
                    backgroundColor: TINT.yellow,
                    borderRadius: cqw(11),
                    padding: `${cqw(8)} ${cqw(8)}`,
                  }}
                >
                  <h3
                    className="font-bytebounce leading-none"
                    style={{ color: INK_BODY, fontSize: cqw(20, TYPE) }}
                  >
                    📌 Notes
                  </h3>
                  <ul
                    className="list-disc font-bytebounce leading-[1.05]"
                    style={{
                      color: INK_BODY,
                      fontSize: cqw(19, TYPE),
                      marginTop: cqw(4),
                      paddingInlineStart: cqw(22),
                    }}
                  >
                    {page.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pager — bottom-right of the page, as in the design. It walks
                  the open chapter's pages only; changing chapter is the
                  bookmarks' job. The frame only draws a forward arrow; a back
                  arrow is added so a chapter reads in both directions. */}
              {/* The arrows keep their 22px design size visually, but sit in a
                  box-border button with transparent padding so the tap target
                  is ~36px on a phone rather than 22px. */}
              <div
                className="mt-auto flex items-center justify-end"
                style={{ gap: cqw(4), paddingTop: cqw(4) }}
              >
                <button
                  type="button"
                  onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                  disabled={pageIdx === 0}
                  aria-label="Previous page"
                  className="box-border shrink-0 transition-transform active:translate-y-0.5 disabled:opacity-25"
                  style={{ width: cqw(38), padding: cqw(8) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-prev.png" alt="" className="w-full" />
                </button>
                <span
                  className="font-bytebounce leading-none"
                  style={{ color: INK_PAGER, fontSize: cqw(22, TYPE) }}
                >
                  {pageIdx + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIdx((i) => Math.min(totalPages - 1, i + 1))}
                  disabled={pageIdx >= totalPages - 1}
                  aria-label="Next page"
                  className="box-border shrink-0 transition-transform active:translate-y-0.5 disabled:opacity-25"
                  style={{ width: cqw(38), padding: cqw(8) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-next.png" alt="" className="w-full" />
                </button>
              </div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guidebook/book-bottom.png" alt="" aria-hidden className="block w-full" />
        </div>
      </div>
    </PageWrapper>
  )
}
