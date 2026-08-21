import { supabase } from '@/lib/supabase'

const SETTING_ID = 'default'

export async function getLeaderboardSuspense(): Promise<boolean> {
  const { data, error } = await supabase
    .from('AppSetting')
    .select('leaderboardSuspense')
    .eq('id', SETTING_ID)
    .maybeSingle()

  if (error) {
    console.error('getLeaderboardSuspense:', error)
    return false
  }
  return data?.leaderboardSuspense === true
}

export async function setLeaderboardSuspense(value: boolean): Promise<void> {
  const { error } = await supabase.from('AppSetting').upsert({
    id: SETTING_ID,
    leaderboardSuspense: value,
  })
  if (error) {
    console.error('setLeaderboardSuspense:', error)
    throw new Error('Failed to update leaderboard suspense')
  }
}
