import { Exercise } from '@/types/exerciseTypes'

// In-memory store for exercise configurations
class ExerciseStore {
  private exercises: Exercise[] = [
    {
        "exerciseId": "squat_1",
        "name": "Squat",
        "description": "Lower your hips until your thighs are parallel to the ground.",
        "calorieFormula": {
          "formula": "(0.00021 * bodyWeight * reps) / 30",
          "unit": "kcal",
          "variables": {
            "bodyWeight": "grams",
            "reps": "count"
          }
        },
        "keyPoints": [
          {
            "name": "leftLeg",
            "landmarks": [23, 25, 27],
            "type": "angle",
            "unit": "degrees"
          },
          {
            "name": "rightLeg",
            "landmarks": [24, 26, 28],
            "type": "angle",
            "unit": "degrees"
          }
        ],
        "thresholds": {
          "down": {
            "leftLeg": 90,
            "rightLeg": 90
          },
          "up": {
            "leftLeg": 160,  
            "rightLeg": 160 
          }
        },
        "countingLogic": {
          "type": "angle_threshold",
          "countOn": "up",
          "requirements": ["leftLeg", "rightLeg"],
          "resetOn": "down"
        },
        "validation": {  
          "correct": "Good form! Keep your back straight and core engaged.",
          "incorrect": "Try to keep your back straight and go a bit lower."
        }
    }
  ]

  getAllExercises(): Exercise[] {
    return this.exercises
  }

  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.find(ex => ex.exerciseId === id)
  }

  addExercise(exercise: Exercise): void {
    this.exercises.push(exercise)
  }

  updateExercise(id: string, updatedExercise: Partial<Exercise>): Exercise | undefined {
    const index = this.exercises.findIndex(ex => ex.exerciseId === id)
    if (index === -1) return undefined

    this.exercises[index] = { ...this.exercises[index], ...updatedExercise }
    return this.exercises[index]
  }

  deleteExercise(id: string): boolean {
    const index = this.exercises.findIndex(ex => ex.exerciseId === id)
    if (index === -1) return false

    this.exercises.splice(index, 1)
    return true
  }
}

// Export singleton instance
export const exerciseStore = new ExerciseStore() 