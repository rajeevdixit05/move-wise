import { Exercise } from "@/types/exerciseTypes"
import { exercises } from "@/app/api/exercise-config/route"

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find(ex => ex.exerciseId === id)
} 