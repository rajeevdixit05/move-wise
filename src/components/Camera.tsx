'use client'

import { useEffect, useRef, useState, useCallback } from "react"
import {
  PoseLandmarker,
  FilesetResolver,
  PoseLandmarkerResult
} from "@mediapipe/tasks-vision"
import { Exercise } from "@/types/exerciseTypes"
import { ExerciseProcessor } from "@/services/exerciseProcessor"

interface CameraProps {
  exerciseConfig: Exercise
  onRepComplete: () => void
  isPaused: boolean
}

export function Camera({ exerciseConfig, onRepComplete, isPaused }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafIdRef = useRef<number>()
  const lastVideoTimeRef = useRef<number>(-1)
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseProcessor] = useState(() => new ExerciseProcessor(exerciseConfig))
  const [hasVideoStarted, setHasVideoStarted] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)

  const drawResults = useCallback((result: PoseLandmarkerResult) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = videoRef.current?.videoWidth || 1280
    canvas.height = videoRef.current?.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw landmarks with optimized rendering
    ctx.save()
    ctx.beginPath()
    
    for (const landmarks of result.landmarks) {
      for (const landmark of landmarks) {
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height
        ctx.moveTo(x + 5, y)
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
      }
    }
    
    ctx.fillStyle = '#00FF00'
    ctx.fill()
    ctx.restore()

    // Draw connections efficiently
    ctx.save()
    ctx.strokeStyle = '#00FF00'
    ctx.lineWidth = 2
    ctx.beginPath()

    const connections = [
      [11, 12], [12, 14], [14, 16], [11, 13], [13, 15],
      [12, 24], [11, 23], [24, 23],
      [23, 25], [25, 27], [24, 26], [26, 28],
      [12, 14], [14, 16], [11, 13], [13, 15]
    ]

    for (const landmarks of result.landmarks) {
      for (const [start, end] of connections) {
        const startPoint = landmarks[start]
        const endPoint = landmarks[end]
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height)
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
      }
    }
    
    ctx.stroke()
    ctx.restore()
  }, [])

  const predictWebcam = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarker || isPaused) {
      rafIdRef.current = requestAnimationFrame(predictWebcam)
      return
    }

    if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
      lastVideoTimeRef.current = videoRef.current.currentTime
      const startTimeMs = performance.now()
      
      try {
        const result = await poseLandmarker.detectForVideo(videoRef.current, startTimeMs)
        drawResults(result)
        processFrame(result)
      } catch (error) {
        console.error('Error in pose detection:', error)
      }
    }

    rafIdRef.current = requestAnimationFrame(predictWebcam)
  }, [poseLandmarker, isPaused, drawResults])

  const setupCamera = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoRef.current.srcObject = stream

      return new Promise<void>((resolve) => {
        if (!videoRef.current) return
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setHasVideoStarted(true)
                resolve()
              })
              .catch(err => {
                console.error('Error playing video:', err)
                setIsLoading(false)
              })
          }
        }
      })
    } catch (err) {
      console.error('Error accessing camera:', err)
      setIsLoading(false)
      throw err
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        await setupCamera()
        
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
      } catch (error) {
        console.error('Error initializing:', error)
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
      if (poseLandmarker) {
        poseLandmarker.close()
      }
    }
  }, [setupCamera])

  const processFrame = useCallback((result: PoseLandmarkerResult) => {
    try {
      if (!result.landmarks[0]) {
        setDetectionError("No body detected. Please step into the camera view.")
        return
      }
      
      exerciseProcessor.processExercise(result.landmarks[0])
      setDetectionError(null)
      const currentCount = exerciseProcessor.getTotalCount()
      if (currentCount > 0) {
        onRepComplete()
      }
    } catch (error) {
      setDetectionError(error instanceof Error ? error.message : "Error processing exercise")
    }
  }, [exerciseProcessor, onRepComplete])

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="text-white text-xl">Loading pose detection...</div>
        </div>
      )}
      {detectionError && (
        <div className="absolute top-4 left-4 right-4 z-40 bg-red-500/80 text-white px-4 py-2 rounded-md">
          {detectionError}
        </div>
      )}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        playsInline
        autoPlay
        muted
        style={{ 
          transform: 'scaleX(-1)',
          visibility: hasVideoStarted ? 'visible' : 'hidden'
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-20"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  )
}

