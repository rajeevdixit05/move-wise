import { Exercise } from "@/types/exerciseTypes"

const API_BASE_URL = '/api'

export const exerciseService = {
  async getAllExercises(): Promise<Partial<Exercise>[]> {
    const response = await fetch(`${API_BASE_URL}/exercise-config`)
    if (!response.ok) throw new Error('Failed to fetch exercises')
    return response.json()
  },

  async getExerciseById(id: string): Promise<Exercise> {
    const response = await fetch(`${API_BASE_URL}/exercise-config?id=${id}`)
    if (!response.ok) throw new Error('Exercise not found')
    return response.json()
  },

  async saveProgress(data: any) {
    const response = await fetch(`${API_BASE_URL}/fitness/insights/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to save progress')
    return response.json()
  }
} 