import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Dumbbell, Heart, Timer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Exercise } from "../../types/exerciseTypes"
import { ExerciseCarousel } from "../components/ExerciseCarousel"
import { headers } from 'next/headers'
import { exercises } from './api/exercise-config/route'

async function getExercises(): Promise<Partial<Exercise>[]> {
  // Return simplified exercises directly
  return exercises.map(({ exerciseId, name, description }) => ({
    exerciseId,
    name,
    description,
    image: `/exercises/${exerciseId}.jpg`
  }))
}

export default async function Home() {
  let exercises: Partial<Exercise>[] = []
  try {
    exercises = await getExercises()
    console.log('Fetched exercises:', exercises.length) // Debug log
  } catch (error) {
    console.error('Failed to fetch exercises:', error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load exercises</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Move Wise: AI Exercise Trainer
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Your personal AI-powered fitness companion. Get real-time feedback and track your progress with advanced pose detection.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-600">
              Get Started
              <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <Dumbbell className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Smart Exercise Detection</h3>
              <p className="text-gray-300">Real-time pose detection and form correction for perfect workouts.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <Timer className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Progress Tracking</h3>
              <p className="text-gray-300">Monitor your reps, sets, and workout duration with precision.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <Heart className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Health Insights</h3>
              <p className="text-gray-300">Track calories burned and get personalized fitness recommendations.</p>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Carousel */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Available Exercises</h2>
          <ExerciseCarousel exercises={exercises} />
        </div>
      </div>
    </div>
  )
}

