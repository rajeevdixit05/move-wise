import { NextResponse } from 'next/server'
import { Exercise } from '@/types/exerciseTypes'
import { AppError, errorHandler } from "@/utils/error"
import { exerciseStore } from '@/data/exercises'

export const exercises: Exercise[] = [
  {
    "exerciseId": "squat_1",
    "name": "Squat",
    "description": "Lower your hips until your thighs are parallel to the ground.",
    "image": "/exercises/squat_1.png",
    "validation": {
      "correct": "Good form! Keep your back straight and core engaged.",
      "incorrect": "Try to keep your back straight and go a bit lower."
    },
    "difficulty": "beginner",
    "muscleGroups": ["quadriceps", "hamstrings", "glutes"],
    "equipment": "none",
    "calorieFormula": {
      "formula": "(0.00032 * bodyWeight * reps) / 30",
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
    }
  },
  {
    exerciseId: "pushup_1",
    name: "Push-up",
    description: "Lower your body by bending your elbows until your chest nearly touches the floor.",
    calorieFormula: {
      formula: "(0.000325 * bodyWeight * reps) / 30",
      unit: "kcal",
      variables: {
        bodyWeight: "grams",
        reps: "count"
      }
    },
    keyPoints: [
      {
        name: "leftArm",
        landmarks: [11, 13, 15],
        type: "angle",
        unit: "degrees"
      },
      {
        name: "rightArm",
        landmarks: [12, 14, 16],
        type: "angle",
        unit: "degrees"
      }
    ],
    thresholds: {
      down: {
        leftArm: 90,
        rightArm: 90
      },
      up: {
        leftArm: 120,
        rightArm: 120
      }
    },
    countingLogic: {
      type: "angle_threshold",
      countOn: "up",
      requirements: ["leftArm", "rightArm"],
      resetOn: "down"
    },
    validation: {
      correct: "Excellent push-up! Keep your body in a straight line.",
      incorrect: "Try to keep your core engaged and avoid sagging your hips."
    }
  },
  {
    exerciseId: "jumping_jack_1",
    name: "Jumping Jack",
    description: "A jumping exercise with legs spread wide and arms going overhead.",
    calorieFormula: {
      formula: "(0.0014 * bodyWeight * minutes * (count / (minutes * averageJacksPerMinute)))",
      unit: "kcal",
      variables: {
        bodyWeight: "grams",
        minutes: "time",
        count: "number",
        averageJacksPerMinute: "50"
      }
    },
    keyPoints: [
      {
        name: "handsDistance",
        landmarks: [15, 16],
        type: "distance",
        unit: "meters"
      },
      {
        name: "feetDistance",
        landmarks: [27, 28],
        type: "distance",
        unit: "meters"
      }
    ],
    thresholds: {
      extended: {
        handsDistance: 0.4,
        feetDistance: 0.3
      },
      closed: {
        handsDistance: 0.2,
        feetDistance: 0.1
      }
    },
    countingLogic: {
      type: "distance_threshold",
      countOn: "closed",
      requirements: ["handsDistance", "feetDistance"],
      resetOn: "extended"
    },
    validation: {
      correct: "Great jumping jacks! Keep your arms and legs fully extended.",
      incorrect: "Try to extend your arms overhead and spread your legs wider."
    }
  },
  {
    exerciseId: "bicep_curl_1",
    name: "Bicep Curl",
    description: "Lift a weight by bending your elbow.",
    type: "ANGLE_BASED",
    calorieFormula: {
      formula: "((0.0003 * bodyWeight + (weight * 0.075)) * reps) / 30",
      unit: "kcal",
      variables: {
        bodyWeight: "grams",
        weight: "grams",
        reps: "count"
      }
    },
    keyPoints: [
      {
        name: "rightArm",
        landmarks: [12, 14, 16],
        type: "angle",
        unit: "degrees"
      },
      {
        name: "leftArm",
        landmarks: [11, 13, 15],
        type: "angle",
        unit: "degrees"
      }
    ],
    thresholds: {
      down: {
        rightArm: 140,
        leftArm: 140
      },
      up: {
        rightArm: 60,
        leftArm: 60
      }
    },
    countingLogic: {
      type: "angle_threshold",
      countOn: "up",
      requirements: ["rightArm", "leftArm"],
      resetOn: "down"
    },
    validation: {
      correct: "Perfect bicep curls! Control the movement and avoid swinging.",
      incorrect: "Try to keep your elbows still and avoid using momentum."
    }
  },
  {
    exerciseId: "plank_1",
    name: "Plank",
    description: "Hold a position similar to a push-up, but with forearms on the ground.",
    type: "POSITION_BASED",
    calorieFormula: {
      formula: "(0.0006 * bodyWeight * minutes)",
      unit: "kcal",
      variables: {
        bodyWeight: "grams",
        minutes: "time"
      }
    },
    keyPoints: [
      {
        name: "Shoulder",
        landmarks: [0],
        type: "POSITION",
        unit: "index"
      },
      {
        name: "Hip",
        landmarks: [23],
        type: "POSITION",
        unit: "index"
      },
      {
        name: "Knee",
        landmarks: [25],
        type: "POSITION",
        unit: "index"
      },
      {
        name: "Ankle",
        landmarks: [27],
        type: "POSITION",
        unit: "index"
      }
    ],
    thresholds: {
      minPoseAngle: 150,
      maxPoseAngle: 180
    },
    countingLogic: {
      type: "position_threshold",
      countOn: "hold",
      requirements: ["Shoulder", "Hip", "Knee", "Ankle"],
      duration: 30
    },
    validation: {
      correct: "Strong plank! Maintain a straight line from head to heels.",
      incorrect: "Avoid sagging your hips or raising your glutes too high."
    }
  }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      const exercises = exerciseStore.getAllExercises()
      return NextResponse.json(
        exercises.map(({ exerciseId, meta }) => ({
          exerciseId,
          name: meta.name,
          description: meta.description,
          image: meta.image
        }))
      )
    }

    const exercise = exerciseStore.getExerciseById(id)
    if (!exercise) {
      throw new AppError('Exercise not found', 'EXERCISE_NOT_FOUND', 404)
    }

    return NextResponse.json(exercise)
  } catch (error) {
    const { error: errorMessage, code, status } = errorHandler(error)
    return NextResponse.json({ error: errorMessage, code }, { status })
  }
}

