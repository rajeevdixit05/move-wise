export interface Exercise {
  exerciseId: string;
  name: string;
  description: string;
  image?: string;
  validation: {
    correct: string;
    incorrect: string;
  };
  difficulty?: string;
  muscleGroups?: string[];
  equipment?: string;
  calorieFormula: {
    formula: string;
    unit: string;
    variables: Record<string, string>;
  };
  keyPoints: Array<{
    name: string;
    landmarks: number[];
    type: "angle" | "distance" | "POSITION";
    unit: string;
  }>;
  thresholds: {
    down?: Record<string, number>;
    up?: Record<string, number>;
    extended?: Record<string, number>;
    closed?: Record<string, number>;
    minPoseAngle?: number;
    maxPoseAngle?: number;
    correct?: Record<string, number>;
  };
  countingLogic: {
    type: "angle_threshold" | "distance_threshold" | "position_threshold";
    countOn: "up" | "closed" | "hold";
    requirements: string[];
    resetOn?: string;
    duration?: number;
  };
}

export interface FitnessInsight {
  exerciseId: string;
  userId: string;
  reps: number;
  calories: number;
  duration: number;
  timestamp: string;
}