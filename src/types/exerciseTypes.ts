export interface Exercise {
  exerciseId: string
  meta: ExerciseMeta
  calorieFormula: CalorieFormula
  keyPoints: KeyPoint[]
  thresholds: ExerciseThresholds
  countingLogic: CountingLogic
}

interface ExerciseMeta {
  name: string
  description: string
  image: string
  validation: {
    correct: string
    incorrect: string
  }
  difficulty: "beginner" | "intermediate" | "advanced"
  muscleGroups: string[]
  equipment: string
}

export interface KeyPoint {
  name: string
  landmarks: number[]
  type: string
  unit: string
}

interface CalorieFormula {
  formula: string
  unit: string
  variables: Record<string, string>
} 