import { ExerciseConfig, FitnessInsight } from "'../types/exerciseTypes'"

export async function getExerciseConfigs(): Promise<ExerciseConfig[]> {
  const res = await fetch("'/api/exercise-config'")
  if (!res.ok) {
    throw new Error("'Failed to fetch exercise configurations'")
  }
  return res.json()
}

export async function saveFitnessInsight(insight: FitnessInsight): Promise<FitnessInsight> {
  const res = await fetch("'/api/fitness-insights'", {
    method: "'POST'",
    headers: {
      "'Content-Type'": "'application/json'",
    },
    body: JSON.stringify(insight),
  })
  if (!res.ok) {
    throw new Error("'Failed to save fitness insight'")
  }
  return res.json()
}

