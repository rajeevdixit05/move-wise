import { Exercise } from "@/types/exerciseTypes"
import { NormalizedLandmark } from "@mediapipe/tasks-vision"

interface AcceptableRanges {
  [key: string]: [number, number] // [min, max]
}

interface CalorieValues {
  [key: string]: number | string
}

export class ExerciseProcessor {
  private totalCount: number = 0
  private isInDownPosition: boolean = false
  private isInUpPosition: boolean = false
  private isInExtendedPosition: boolean = false
  private startTime: number = 0

  // Configurable ranges for different exercises
  private acceptableRanges: AcceptableRanges = {
    leftArmDown: [80, 90],
    leftArmUp: [120, 130]
  }

  constructor(private exercise: Exercise) {}

  private calculateAngle(
    landmarkA: NormalizedLandmark,
    landmarkB: NormalizedLandmark,
    landmarkC: NormalizedLandmark
  ): number {
    const vectorBA = {
      x: landmarkA.x - landmarkB.x,
      y: landmarkA.y - landmarkB.y
    }
    const vectorBC = {
      x: landmarkC.x - landmarkB.x,
      y: landmarkC.y - landmarkB.y
    }

    const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y
    const magnitudeBA = Math.sqrt(Math.pow(vectorBA.x, 2) + Math.pow(vectorBA.y, 2))
    const magnitudeBC = Math.sqrt(Math.pow(vectorBC.x, 2) + Math.pow(vectorBC.y, 2))

    const cosAngle = dotProduct / (magnitudeBA * magnitudeBC)
    const angleInRadians = Math.acos(cosAngle)
    return (angleInRadians * 180) / Math.PI
  }

  private calculateDistance(
    landmarkA: NormalizedLandmark,
    landmarkB: NormalizedLandmark
  ): number {
    const dx = landmarkA.x - landmarkB.x
    const dy = landmarkA.y - landmarkB.y
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  }

  private processAngleBasedExercise(landmarks: NormalizedLandmark[]): void {
    const angles = new Map<string, number>()
    let isPostureCorrect = true

    // Calculate angles for all keypoints
    for (const keyPoint of this.exercise.keyPoints) {
      const landmarkPoints = keyPoint.landmarks
      const angle = this.calculateAngle(
        landmarks[landmarkPoints[0]],
        landmarks[landmarkPoints[1]],
        landmarks[landmarkPoints[2]]
      )
      angles.set(keyPoint.name, angle)

      const acceptableRange = this.acceptableRanges[keyPoint.name]
      if (acceptableRange && (angle < acceptableRange[0] || angle > acceptableRange[1])) {
        isPostureCorrect = false
        this.notifyUserWrongPosture(keyPoint.name, angle)
      }
    }

    // Check thresholds
    const isDown = this.exercise.thresholds.down && 
      Object.entries(this.exercise.thresholds.down).every(([key, threshold]) => {
        const angle = angles.get(key)
        return angle !== undefined && angle <= threshold
      })

    const isUp = this.exercise.thresholds.up && 
      Object.entries(this.exercise.thresholds.up).every(([key, threshold]) => {
        const angle = angles.get(key)
        return angle !== undefined && angle >= threshold
      })

    // Update count based on counting logic
    if (this.exercise.countingLogic.countOn === "up") {
      if (isUp && !this.isInUpPosition) {
        this.isInUpPosition = true
        this.isInDownPosition = false
      } else if (isDown && this.isInUpPosition && !this.isInDownPosition) {
        this.totalCount++
        this.isInUpPosition = false
        this.isInDownPosition = true
      }
    }

    if (!isPostureCorrect) {
      this.notifyUserIncorrectPosture()
    }
  }

  private processDistanceBasedExercise(landmarks: NormalizedLandmark[]): void {
    const distances = new Map<string, number>()

    // Calculate distances for all keypoints
    for (const keyPoint of this.exercise.keyPoints) {
      const distance = this.calculateDistance(
        landmarks[keyPoint.landmarks[0]],
        landmarks[keyPoint.landmarks[1]]
      )
      distances.set(keyPoint.name, distance)
    }

    const isExtended = this.exercise.thresholds.extended &&
      Object.entries(this.exercise.thresholds.extended).every(([key, threshold]) => {
        const distance = distances.get(key)
        return distance !== undefined && distance >= threshold
      })

    const isClosed = this.exercise.thresholds.closed &&
      Object.entries(this.exercise.thresholds.closed).every(([key, threshold]) => {
        const distance = distances.get(key)
        return distance !== undefined && distance <= threshold
      })

    if (this.exercise.countingLogic.countOn === "closed") {
      if (isExtended && !this.isInExtendedPosition) {
        this.isInExtendedPosition = true
      } else if (isClosed && this.isInExtendedPosition) {
        this.totalCount++
        this.isInExtendedPosition = false
      }
    }
  }

  private processPositionBasedExercise(landmarks: NormalizedLandmark[]): void {
    if (this.startTime === 0) {
      this.startTime = Date.now()
    }

    const distances = new Map<string, number>()
    for (const keyPoint of this.exercise.keyPoints) {
      const distance = this.calculateDistance(
        landmarks[keyPoint.landmarks[0]],
        landmarks[keyPoint.landmarks[1]]
      )
      distances.set(keyPoint.name, distance)
    }

    const isCorrectPosition = this.exercise.thresholds.correct &&
      Object.entries(this.exercise.thresholds.correct).every(([key, threshold]) => {
        const distance = distances.get(key)
        return distance !== undefined && distance <= threshold
      })

    if (isCorrectPosition) {
      const elapsedSeconds = (Date.now() - this.startTime) / 1000
      if (elapsedSeconds >= (this.exercise.countingLogic.duration || 0)) {
        this.totalCount = 1
      }
    } else {
      this.startTime = Date.now()
    }
  }

  private notifyUserWrongPosture(keyPointName: string, angle: number): void {
    console.warn(`Incorrect posture detected at ${keyPointName}. Current angle: ${angle}`)
  }

  private notifyUserIncorrectPosture(): void {
    console.warn('You are performing the exercise with incorrect posture!')
  }

  processExercise(landmarks: NormalizedLandmark[]): void {
    if (landmarks.length < 33) return

    switch (this.exercise.countingLogic.type) {
      case "angle_threshold":
        this.processAngleBasedExercise(landmarks)
        break
      case "distance_threshold":
        this.processDistanceBasedExercise(landmarks)
        break
      case "position_threshold":
        this.processPositionBasedExercise(landmarks)
        break
    }
  }

  getTotalCount(): number {
    return this.totalCount
  }

  calculateCalories(bodyWeight: number, duration?: number): number {
    const { formula, variables } = this.exercise.calorieFormula
    
    const values: CalorieValues = {
      bodyWeight,
      reps: this.totalCount,
      minutes: duration || 0,
      count: this.totalCount,
      ...Object.fromEntries(
        Object.entries(variables).map(([key, value]) => [
          key,
          value === "number" ? Number(value) : value
        ])
      )
    }

    try {
      const calculatedFormula = formula.replace(
        /\b(\w+)\b/g,
        match => values[match]?.toString() || match
      )
      
      return Number(Function(`"use strict"; return (${calculatedFormula})`)())
    } catch (error) {
      console.error('Error calculating calories:', error)
      return 0
    }
  }
} 