import OpponentManager from '@/components/opponents/OpponentManager'
import VenueManager from '@/components/venues/VenueManager'

export default function Profile() {
  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Profile</h1>
      <OpponentManager />
      <div className="mt-8">
        <VenueManager />
      </div>
    </div>
  )
}
