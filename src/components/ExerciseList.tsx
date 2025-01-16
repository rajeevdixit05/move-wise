import Link from "'next/link'"
import { ExerciseConfig } from "'../types/exerciseTypes'"

interface ExerciseListProps {
  exerciseConfigs: ExerciseConfig[]
}

export default function ExerciseList({ exerciseConfigs }: ExerciseListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exerciseConfigs.map((config) => (
        <Link href={`/exercise/${config.exerciseId}`} key={config.exerciseId}>
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{config.name}</h2>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

