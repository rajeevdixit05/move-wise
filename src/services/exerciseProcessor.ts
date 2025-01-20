import { Exercise, FitnessInsight } from "@/types/exerciseTypes"
import { NormalizedLandmark } from "@mediapipe/tasks-vision"

interface CalorieValues {
  [key: string]: number | string
}

export class ExerciseProcessor {
  private totalCount: number = 0
  private isInDownPosition: boolean = false
  private isInUpPosition: boolean = false
  private isInExtendedPosition: boolean = false
  private startTime: number = 0

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
      if (keyPoint.type !== "angle") continue

      // Skip if keypoint is not in requirements
      if (!this.exercise.countingLogic.requirements.includes(keyPoint.name)) {
        continue
      }

      const landmarkPoints = keyPoint.landmarks
      const angle = this.calculateAngle(
        landmarks[landmarkPoints[0]],
        landmarks[landmarkPoints[1]],
        landmarks[landmarkPoints[2]]
      )
      angles.set(keyPoint.name, angle)

      // Check if angle is within exercise-specific thresholds
      const downThreshold = this.exercise.thresholds.down?.[keyPoint.name]
      const upThreshold = this.exercise.thresholds.up?.[keyPoint.name]
      
      if (this.exercise.countingLogic.countOn === "up") {
        if (upThreshold && angle < upThreshold) {
          isPostureCorrect = false
          this.notifyUserWrongPosture(
            keyPoint.name, 
            angle, 
            `${this.exercise.validation.incorrect}\nExtend more to reach ${upThreshold} degrees`
          )
        }
        if (downThreshold && angle > downThreshold) {
          isPostureCorrect = false
          this.notifyUserWrongPosture(
            keyPoint.name, 
            angle, 
            `${this.exercise.validation.incorrect}\nLower to reach ${downThreshold} degrees`
          )
        }
      }
    }

    // Verify all required keypoints are measured
    const hasAllRequiredPoints = this.exercise.countingLogic.requirements.every(
      req => angles.has(req)
    )
    if (!hasAllRequiredPoints) {
      throw new Error("Missing required keypoints for exercise validation")
    }

    // Check position thresholds based on counting logic
    const isDown = this.exercise.thresholds.down && 
      Object.entries(this.exercise.thresholds.down)
        .filter(([key]) => this.exercise.countingLogic.requirements.includes(key))
        .every(([key, threshold]) => {
          const angle = angles.get(key)
          return angle !== undefined && angle <= threshold
        })

    const isUp = this.exercise.thresholds.up && 
      Object.entries(this.exercise.thresholds.up)
        .filter(([key]) => this.exercise.countingLogic.requirements.includes(key))
        .every(([key, threshold]) => {
          const angle = angles.get(key)
          return angle !== undefined && angle >= threshold
        })

    // Update count based on exercise-specific counting logic
    switch (this.exercise.countingLogic.countOn) {
      case "up":
        if (isUp && !this.isInUpPosition) {
          this.isInUpPosition = true
          this.isInDownPosition = false
          if (isPostureCorrect) {
            this.notifyUserCorrectPosture()
          }
        } else if (isDown && this.isInUpPosition && !this.isInDownPosition) {
          if (isPostureCorrect) {
            this.totalCount++
            this.notifyUserCorrectPosture()
          }
          this.isInUpPosition = false
          this.isInDownPosition = true
        }
        break;

      case "hold":
        if (isPostureCorrect) {
          const elapsedTime = (Date.now() - this.startTime) / 1000
          if (elapsedTime >= (this.exercise.countingLogic.duration || 0)) {
            this.totalCount = 1
            this.notifyUserCorrectPosture()
          }
        } else {
          this.startTime = Date.now()
        }
        break;
    }

    if (!isPostureCorrect) {
      this.notifyUserIncorrectPosture()
    }
  }

  private processDistanceBasedExercise(landmarks: NormalizedLandmark[]): void {
    const distances = new Map<string, number>()
    let isPostureCorrect = true

    // Calculate distances for required keypoints
    for (const keyPoint of this.exercise.keyPoints) {
      if (keyPoint.type !== "distance") continue

      // Skip if keypoint is not in requirements
      if (!this.exercise.countingLogic.requirements.includes(keyPoint.name)) {
        continue
      }

      const distance = this.calculateDistance(
        landmarks[keyPoint.landmarks[0]],
        landmarks[keyPoint.landmarks[1]]
      )
      distances.set(keyPoint.name, distance)
    }

    // Verify all required keypoints are measured
    const hasAllRequiredPoints = this.exercise.countingLogic.requirements.every(
      req => distances.has(req)
    )
    if (!hasAllRequiredPoints) {
      throw new Error("Missing required keypoints for exercise validation")
    }

    const isExtended = this.exercise.thresholds.extended &&
      Object.entries(this.exercise.thresholds.extended)
        .filter(([key]) => this.exercise.countingLogic.requirements.includes(key))
        .every(([key, threshold]) => {
          const distance = distances.get(key)
          if (distance === undefined) return false
          
          if (distance < threshold) {
            isPostureCorrect = false
            this.notifyUserWrongPosture(
              key,
              distance,
              `${this.exercise.validation.incorrect}\nExtend further to reach ${threshold}`
            )
            return false
          }
          return true
        })

    const isClosed = this.exercise.thresholds.closed &&
      Object.entries(this.exercise.thresholds.closed)
        .filter(([key]) => this.exercise.countingLogic.requirements.includes(key))
        .every(([key, threshold]) => {
          const distance = distances.get(key)
          if (distance === undefined) return false
          
          if (distance > threshold) {
            isPostureCorrect = false
            this.notifyUserWrongPosture(
              key,
              distance,
              `${this.exercise.validation.incorrect}\nClose position to reach ${threshold}`
            )
            return false
          }
          return true
        })

    // Update count based on exercise-specific counting logic
    switch (this.exercise.countingLogic.countOn) {
      case "closed":
        if (isExtended && !this.isInExtendedPosition) {
          this.isInExtendedPosition = true
          if (isPostureCorrect) {
            this.notifyUserCorrectPosture()
          }
        } else if (isClosed && this.isInExtendedPosition) {
          if (isPostureCorrect) {
            this.totalCount++
            this.notifyUserCorrectPosture()
          }
          this.isInExtendedPosition = false
        }
        break;
    }

    if (!isPostureCorrect) {
      this.notifyUserIncorrectPosture()
    }
  }

  private processPositionBasedExercise(landmarks: NormalizedLandmark[]): void {
    if (this.startTime === 0) {
      this.startTime = Date.now()
    }

    let isPostureCorrect = true
    const angles = new Map<string, number>()

    // Verify all required keypoints are present
    const hasAllRequiredPoints = this.exercise.countingLogic.requirements.every(
      req => this.exercise.keyPoints.find(kp => kp.name === req)
    )
    if (!hasAllRequiredPoints) {
      throw new Error("Missing required keypoints for exercise validation")
    }

    // Calculate angles between required sequential keypoints
    for (let i = 0; i < this.exercise.keyPoints.length - 2; i++) {
      const point1 = this.exercise.keyPoints[i]
      const point2 = this.exercise.keyPoints[i + 1]
      const point3 = this.exercise.keyPoints[i + 2]

      // Skip if any point is not in requirements
      if (!this.exercise.countingLogic.requirements.includes(point1.name) ||
          !this.exercise.countingLogic.requirements.includes(point2.name) ||
          !this.exercise.countingLogic.requirements.includes(point3.name)) {
        continue
      }

      const angle = this.calculateAngle(
        landmarks[point1.landmarks[0]],
        landmarks[point2.landmarks[0]],
        landmarks[point3.landmarks[0]]
      )
      
      const segmentName = `${point1.name}-${point2.name}-${point3.name}`
      angles.set(segmentName, angle)

      // Check if angle is within the exercise's min/max thresholds
      const minAngle = this.exercise.thresholds.minPoseAngle
      const maxAngle = this.exercise.thresholds.maxPoseAngle

      if (minAngle && maxAngle) {
        if (angle < minAngle || angle > maxAngle) {
          isPostureCorrect = false
          this.notifyUserWrongPosture(
            segmentName,
            angle,
            `${this.exercise.validation.incorrect}\nMaintain angle between ${minAngle}° and ${maxAngle}°`
          )
        }
      }

      // Check for any position-specific thresholds
      const correctThreshold = this.exercise.thresholds.correct?.[segmentName]
      if (correctThreshold !== undefined) {
        const isCorrect = angle <= correctThreshold
        if (!isCorrect) {
          isPostureCorrect = false
          this.notifyUserWrongPosture(
            segmentName,
            angle,
            `${this.exercise.validation.incorrect}\nAdjust position to reach ${correctThreshold}°`
          )
        }
      }
    }

    // Handle hold-based counting logic
    if (this.exercise.countingLogic.countOn === "hold") {
      if (isPostureCorrect) {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000
        if (elapsedSeconds >= (this.exercise.countingLogic.duration || 0)) {
          this.totalCount = 1
          this.notifyUserCorrectPosture()
        }
      } else {
        this.startTime = Date.now()
      }
    }

    if (!isPostureCorrect) {
      this.notifyUserIncorrectPosture()
    }
  }

  private notifyUserCorrectPosture(): void {
    console.info(this.exercise.validation.correct)
  }

  private notifyUserIncorrectPosture(): void {
    console.warn(this.exercise.validation.incorrect)
  }

  private notifyUserWrongPosture(keyPointName: string, angle: number, message?: string): void {
    console.warn(`Incorrect posture at ${keyPointName}. Current angle: ${angle}°. ${message || ''}`)
  }

  processExercise(landmarks: NormalizedLandmark[]): void {
    if (landmarks.length < 33) {
      throw new Error("Insufficient landmarks detected. Please ensure your full body is visible.")
    }

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
      default:
        throw new Error(`Unsupported exercise type: ${this.exercise.countingLogic.type}`)
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