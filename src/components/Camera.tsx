'use client'

import { useEffect, useRef, useState } from "react"
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingOptions,
  PoseLandmarkerResult
} from "@mediapipe/tasks-vision"
import { Exercise } from "@/types/exerciseTypes"
import { ExerciseProcessor } from "@/services/exerciseProcessor"

interface CameraProps {
  exerciseConfig: Exercise
  onRepComplete: () => void
}

export function Camera({ exerciseConfig, onRepComplete }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseProcessor] = useState(() => new ExerciseProcessor(exerciseConfig))

  useEffect(() => {
    let lastVideoTime = -1
    let rafId: number

    async function initializePoseLandmarker() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      
      const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      })
      
      setPoseLandmarker(landmarker)
      setIsLoading(false)
    }

    async function setupCamera() {
      if (!videoRef.current) return

      const constraints = {
        video: {
          width: 1280,
          height: 720
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        videoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve()
            }
          }
        })
        videoRef.current.play()
      } catch (err) {
        console.error("'Error accessing camera:'", err)
      }
    }

    function drawResults(result: PoseLandmarkerResult) {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = videoRef.current?.videoWidth || 1280
      canvas.height = videoRef.current?.videoHeight || 720

      const ctx = canvas.getContext("'2d'")
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw landmarks
      for (const landmarks of result.landmarks) {
        // Draw points
        for (const landmark of landmarks) {
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height
          
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = "'#00FF00'"
          ctx.fill()
        }

        // Draw connections
        const connections = [
          // Torso
          [11, 12], [12, 14], [14, 16], [11, 13], [13, 15],
          [12, 24], [11, 23], [24, 23],
          // Legs
          [23, 25], [25, 27], [24, 26], [26, 28],
          // Arms
          [12, 14], [14, 16], [11, 13], [13, 15]
        ]

        ctx.strokeStyle = "'#00FF00'"
        ctx.lineWidth = 2

        for (const [start, end] of connections) {
          const startPoint = landmarks[start]
          const endPoint = landmarks[end]

          ctx.beginPath()
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height)
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
          ctx.stroke()
        }
      }
    }

    function predictWebcam() {
      if (!videoRef.current || !canvasRef.current || !poseLandmarker) {
        rafId = requestAnimationFrame(predictWebcam)
        return
      }

      const startTimeMs = performance.now()
      
      if (lastVideoTime !== videoRef.current.currentTime) {
        lastVideoTime = videoRef.current.currentTime
        poseLandmarker.detectForVideo(videoRef.current, startTimeMs, (result) => {
          drawResults(result)
        })
      }

      rafId = requestAnimationFrame(predictWebcam)
    }

    async function init() {
      await initializePoseLandmarker()
      await setupCamera()
      predictWebcam()
    }

    init()

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
      if (poseLandmarker) {
        poseLandmarker.close()
      }
    }
  }, [poseLandmarker])

  const processFrame = (result: PoseLandmarkerResult) => {
    if (result.landmarks[0]) {
      exerciseProcessor.processExercise(result.landmarks[0])
      if (exerciseProcessor.getTotalCount() > prevCount) {
        onRepComplete()
      }
    }
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-xl">Loading pose detection...</div>
        </div>
      )}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover mirror"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full mirror"
      />
      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}

