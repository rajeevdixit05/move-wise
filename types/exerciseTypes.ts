export interface KeyPoint {
  name: string
  landmarks: number[]
  type: 'angle' | 'distance' | 'POSITION'
  unit: string
}

export interface Thresholds {
  down?: Record<string, number>
  up?: Record<string, number>
  extended?: Record<string, number>
  closed?: Record<string, number>
  minPoseAngle?: number
  maxPoseAngle?: number
}

export interface CountingLogic {
  type: 'angle_threshold' | 'distance_threshold' | 'position_threshold'
  countOn: 'up' | 'down' | 'closed' | 'hold'
  requirements: string[]
  resetOn?: 'up' | 'down' | 'extended'
  duration?: number
}

export interface Exercise {
  exerciseId: string
  name: string
  description: string
  type?: string
  calorieFormula: {
    formula: string
    unit: string
    variables: Record<string, string>
  }
  keyPoints: KeyPoint[]
  thresholds: Thresholds
  countingLogic: CountingLogic
  validation: {
    correct: string
    incorrect: string
  }
}

export interface FitnessInsight {
  userId: string
  exerciseId: string
  startTime: Date
  endTime: Date
  exitState: "READY" | "IN_PROGRESS" | "COMPLETED" | "PAUSED"
  repetitions: number
  setsCompleted: number
  duration: number
  caloriesBurned: number
}

