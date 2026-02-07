import MatchHistoryList from '@/components/matches/MatchHistoryList'

export default function Dashboard() {
  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-lg font-semibold text-text-secondary mb-4">Match History</h2>
      <MatchHistoryList />
    </div>
  )
}
