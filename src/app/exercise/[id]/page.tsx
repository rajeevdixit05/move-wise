'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react"
import Link from "next/link"
import { Camera } from "@/components/Camera"
import { Exercise } from "@/types/exerciseTypes"
import { useParams } from 'next/navigation'

export default function ExercisePage() {
  const params = useParams()
  const exerciseId = params.id as string
  
  const [stage, setStage] = useState<'intro' | 'setup' | 'countdown' | 'workout'>('intro')
  const [isPaused, setIsPaused] = useState(false)
  const [reps, setReps] = useState(0)
  const [time, setTime] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [exercise, setExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    // Fetch exercise configuration
    fetch(`/api/exercise-config?id=${exerciseId}`)
      .then(res => res.json())
      .then(data => setExercise(data))
  }, [exerciseId])

  useEffect(() => {
    if (stage === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setStage('workout')
            return 3
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [stage])

  useEffect(() => {
    if (stage === 'workout' && !isPaused) {
      const interval = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [stage, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!exercise) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative h-screen">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <Link href="/" className="inline-flex items-center text-white">
            <ArrowLeft className="mr-2" />
            Back
          </Link>
        </div>

        {stage === 'intro' && (
          <div className="h-full flex flex-col items-center justify-between p-4">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl font-bold mb-4">{exercise.name}</h1>
              <p className="text-xl text-gray-300 mb-8">{exercise.description}</p>
              <Button 
                size="lg" 
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => setStage('setup')}
              >
                Start Exercise
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {stage === 'setup' && (
          <div className="h-full flex flex-col items-center justify-between p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
              <Card className="bg-white/10 p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Setup your phone</h2>
                <ol className="space-y-4">
                  <li>1. Put your phone against a wall</li>
                  <li>2. Move 4 steps back</li>
                </ol>
              </Card>
              <Button 
                size="lg" 
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => setStage('countdown')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {stage === 'countdown' && (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-6xl font-bold">{countdown}</h2>
            <p className="text-xl">Your workout starts in</p>
          </div>
        )}

        {stage === 'workout' && (
          <>
            <Camera 
              exerciseConfig={exercise}
              onRepComplete={() => setReps(prev => prev + 1)}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-4xl font-bold">{formatTime(time)}</div>
                  <div className="text-sm text-gray-400">min</div>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>
                <div>
                  <div className="text-4xl font-bold">{reps}</div>
                  <div className="text-sm text-gray-400">reps</div>
                </div>
              </div>
              <Button className="w-full bg-teal-500 hover:bg-teal-600">
                Complete Workout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

