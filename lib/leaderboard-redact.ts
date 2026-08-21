function redactMember(m: any) {
  return {
    id: m.id,
    name: '?',
    points: 0,
    funFactsCollected: 0,
    instagram: null,
    avatarConfig: null,
    isAdmin: false,
  }
}

function redactGroup(g: any) {
  return {
    id: g.id,
    name: '?',
    emblem: '',
    emblemUrl: null,
    color: '#888888',
    totalPoints: 0,
    members: (g.members ?? []).map(redactMember),
    _count: g._count ?? { members: (g.members ?? []).length },
  }
}

function redactStudent(s: any) {
  return {
    id: s.id,
    name: '?',
    studentId: '?',
    points: 0,
    funFactsCollected: 0,
    avatarConfig: null,
    isAdmin: false,
    group: s.group
      ? { name: '?', emblem: '', emblemUrl: null, color: '#888888' }
      : null,
  }
}

export function redactLeaderboardPayload(payload: {
  groups: any[]
  topStudents: any[]
}) {
  return {
    groups: (payload.groups ?? []).map(redactGroup),
    topStudents: (payload.topStudents ?? []).map(redactStudent),
  }
}

export function redactFeedPayload() {
  return { feed: [] as const }
}
