import type { IntroStep } from '@/components/onboarding/IntroOverlay'

/** Guided tour steps mapped by page key. */
export const TOURS: Record<string, IntroStep[]> = {
  dashboard: [
    {
      target: 'announcements',
      title: 'LATEST NEWS',
      description: 'The newest announcement shows up here first — check back daily so you never miss an update.',
    },
    {
      target: 'actions',
      title: 'QUICK ACTIONS',
      description: 'Jump straight to the Guidebook, Timeline, Map, or Food listings without digging through menus.',
    },
    {
      target: 'stats',
      title: 'YOUR PROGRESS',
      description: 'Your total points and how many fun facts you’ve collected out of every committee member on campus.',
    },
    {
      target: 'quests',
      title: 'ACTIVE QUESTS',
      description: 'Missions you can complete right now — scan the matching QR poster to finish one and earn points.',
    },
    {
      target: 'all-announcements',
      title: 'ALL ANNOUNCEMENTS',
      description: 'Every announcement posted so far, not just the newest one — scroll down any time to catch up.',
    },
  ],
  info: [
    {
      target: 'info-guidebook',
      title: 'GUIDE BOOK',
      description: 'Survival tips for SU life — dorms, dining, and everything in between.',
    },
    {
      target: 'info-committee',
      title: 'COMMITTEE',
      description: 'Meet the NSO’26 committee — the team running your orientation, grouped by division.',
    },
    {
      target: 'info-timeline',
      title: 'TIMELINE',
      description: 'The full day-by-day event schedule, so you always know what’s next.',
    },
    {
      target: 'info-clubs',
      title: 'UKM CLUBS',
      description: 'Browse student clubs and organizations to find your people.',
    },
    {
      target: 'info-maps',
      title: 'CAMPUS MAP',
      description: 'Zones and scan spots across campus — see where the committee is stationed.',
    },
  ],
  scan: [
    {
      target: 'scan-camera',
      title: 'POINT & SCAN',
      description: 'Aim your camera at a committee member’s QR code or a quest poster to unlock it instantly.',
    },
    {
      target: 'scan-controls',
      title: 'FLIP OR UPLOAD',
      description: 'Flip to your front camera, or upload a photo if you already have one saved.',
    },
    {
      target: 'scan-stats',
      title: 'YOUR SCAN COUNT',
      description: 'Track how many fun facts you’ve collected today, and in total.',
    },
    {
      target: 'scan-recent',
      title: 'RECENT SCANS',
      description: 'A running receipt of everything you’ve scanned so far, in case you lose track.',
    },
  ],
  leaderboard: [
    {
      target: 'lb-live',
      title: 'LIVE UPDATES',
      description: 'Scores refresh automatically every 30 seconds — tap [refresh] any time for the newest numbers.',
    },
    {
      target: 'lb-leader',
      title: 'CURRENT LEADER',
      description: 'Whoever’s on top right now. Switch tabs to see the leading guild or the leading player.',
    },
    {
      target: 'lb-tabs',
      title: 'GUILDS · PLAYERS · RECORD',
      description: 'Guild rankings, individual top players, or a live feed of the most recent scoring activity.',
    },
    {
      target: 'lb-list',
      title: 'FULL RANKINGS',
      description: 'Tap any guild to expand its roster and see each member’s point contribution.',
    },
  ],
  profile: [
    {
      target: 'profile-header',
      title: 'THAT’S YOU',
      description: 'Your avatar, name, and level. The bar underneath shows your XP progress to the next level.',
    },
    {
      target: 'profile-stats',
      title: 'YOUR STATS',
      description: 'Total points, fun facts collected, quests completed, and your house (group).',
    },
    {
      target: 'profile-achievements',
      title: 'ACHIEVEMENTS',
      description: 'Badges you unlock by completing quests — locked ones show what you’re still missing.',
    },
    {
      target: 'profile-activity',
      title: 'ACTIVITY LOG',
      description: 'A history of your most recent fun-fact scans, newest first.',
    },
  ],
}
