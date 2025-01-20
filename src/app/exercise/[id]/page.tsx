'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Pause, Play } from "lucide-react"
import Link from "next/link"
import { Camera } from "@/components/Camera"
import { Exercise } from "@/types/exerciseTypes"
import { useParams, useRouter } from 'next/navigation'
import { saveFitnessInsight } from '@/lib/api'
import { getExerciseById } from "@/utils/exercises"

export default function ExercisePage() {
  const params = useParams()
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [reps, setReps] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    function loadExercise() {
      const data = getExerciseById(params.id)
      if (data) {
        setExercise(data)
      }
    }
    loadExercise()
  }, [params.id])

  useEffect(() => {
    if (!isPaused && isStarted) {
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, isStarted])

  const handleRepComplete = () => {
    setReps(prev => prev + 1)
  }

  const handleStartExercise = () => {
    setIsStarted(true)
    setIsPaused(false)
    startTimeRef.current = Date.now()
  }

  const togglePause = () => {
    setIsPaused(prev => !prev)
    if (isPaused) {
      startTimeRef.current = Date.now() - (duration * 1000)
    }
  }

  const handleCompleteWorkout = async () => {
    if (!exercise || isLoading) return

    setIsLoading(true)
    try {
      await saveFitnessInsight({
        exerciseId: exercise.exerciseId,
        userId: 'user123', // Replace with actual user ID
        reps,
        calories: 0, // Calculate this based on exercise formula
        duration,
        timestamp: new Date().toISOString()
      })
      router.push('/')
    } catch (error) {
      console.error('Error saving workout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!exercise) {
    return <div>Loading...</div>
  }

  const exerciseName = exercise.name
  const exerciseDescription = exercise.description
  const exerciseImage = exercise.image

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-white hover:text-teal-500 flex items-center gap-2">
            <ArrowLeft className="w-6 h-6" />
            Back to Exercises
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <div className="aspect-video relative">
                {isStarted ? (
                  <Camera 
                    exerciseConfig={exercise} 
                    onRepComplete={handleRepComplete}
                    isPaused={isPaused}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Button
                      size="lg"
                      className="bg-teal-500 hover:bg-teal-600"
                      onClick={handleStartExercise}
                    >
                      Start Exercise
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{exerciseName}</h1>
              <p className="text-gray-300">{exerciseDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Reps</div>
                <div className="text-2xl font-bold text-white">{reps}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Duration</div>
                <div className="text-2xl font-bold text-white">{duration}s</div>
              </div>
            </div>

            <div className="flex gap-4">
              {isStarted && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={togglePause}
                >
                  {isPaused ? (
                    <><Play className="w-5 h-5 mr-2" /> Resume Exercise</>
                  ) : (
                    <><Pause className="w-5 h-5 mr-2" /> Pause Exercise</>
                  )}
                </Button>
              )}
              {isStarted && (
                <Button
                  size="lg"
                  className="w-full bg-teal-500 hover:bg-teal-600"
                  onClick={handleCompleteWorkout}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Complete Workout'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

