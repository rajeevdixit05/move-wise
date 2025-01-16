'use client'

import { useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Exercise } from "../../types/exerciseTypes"

interface ExerciseCarouselProps {
  exercises: Partial<Exercise>[]
}

export function ExerciseCarousel({ exercises }: ExerciseCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 400 // Adjust scroll amount as needed
    const container = scrollContainerRef.current
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative px-4 py-8">
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/50 hover:bg-gray-800 rounded-full"
        onClick={() => scroll('left')}
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/50 hover:bg-gray-800 rounded-full"
        onClick={() => scroll('right')}
      >
        <ArrowRight className="h-6 w-6 text-white" />
      </Button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide mx-8 scroll-smooth"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="flex gap-6 pb-4">
          {exercises.map((exercise) => (
            <div 
              key={exercise.exerciseId}
              className="flex-none w-[300px]"
            >
              <Link href={`/exercise/${exercise.exerciseId}`}>
                <Card className="group h-full bg-gray-800/50 hover:bg-gray-700 border-gray-700 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <Image
                        src={exercise.image || `/exercises/${exercise.exerciseId}.jpg`}
                        alt={exercise.name || ''}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                        {exercise.name}
                      </h3>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {exercise.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <div className="h-1 bg-gray-700 mt-4 mx-8 rounded-full overflow-hidden">
        <div 
          className="h-full bg-teal-500 transition-all duration-300"
          style={{
            width: scrollContainerRef.current 
              ? `${(scrollContainerRef.current.scrollLeft / (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)) * 100}%`
              : '0%'
          }}
        />
      </div>
    </div>
  )
} 