import { NextResponse } from "'next/server'"
import { FitnessInsight } from "'../../../types/exerciseTypes'"

let fitnessInsights: FitnessInsight[] = []

export async function GET() {
  return NextResponse.json(fitnessInsights)
}

export async function POST(request: Request) {
  const newInsight = await request.json()
  // In a real application, you would validate and save the new insight to a database
  fitnessInsights.push(newInsight)
  return NextResponse.json(newInsight, { status: 201 })
}

