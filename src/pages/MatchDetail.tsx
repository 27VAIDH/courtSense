import { useParams, useNavigate } from 'react-router-dom'

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="px-4 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-text-secondary min-h-[48px]"
      >
        ← Back
      </button>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-xl font-bold text-text-primary">Match #{id}</h1>
        <p className="text-text-secondary mt-2">Match detail view coming soon</p>
      </div>
    </div>
  )
}
