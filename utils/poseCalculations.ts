import { NormalizedLandmark } from "'@mediapipe/tasks-vision'"

export function calculateAngle(
  p1: NormalizedLandmark,
  p2: NormalizedLandmark,
  p3: NormalizedLandmark
): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
                  Math.atan2(p1.y - p2.y, p1.x - p2.x)
  let angle = Math.abs(radians * 180.0 / Math.PI)
  
  if (angle > 180.0) {
    angle = 360 - angle
  }
  
  return angle
}

export function isSquatPosition(landmarks: NormalizedLandmark[]): boolean {
  // Hip, knee, ankle indices for left and right side
  const leftHip = landmarks[23]
  const leftKnee = landmarks[25]
  const leftAnkle = landmarks[27]
  const rightHip = landmarks[24]
  const rightKnee = landmarks[26]
  const rightAnkle = landmarks[28]

  const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
  const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle)

  // Check if both legs are bent at approximately 90 degrees
  return leftLegAngle <= 100 && rightLegAngle <= 100
}

