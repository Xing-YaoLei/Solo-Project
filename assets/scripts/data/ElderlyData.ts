export interface MedicineItem {
    id: string;
    name: string;
    dosage: string;
    time: string;
    isCorrect: boolean;
}

export interface VisitRecord {
    id: string;
    visitorName: string;
    visitorRelation: string;
    visitTime: string;
    isCorrect: boolean;
}

export interface ActivityItem {
    id: string;
    name: string;
    time: string;
    location: string;
    isCorrect: boolean;
}

export interface ElderlyProfile {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female';
    roomNumber: string;
    avatar: string;
    healthLevel: number;
}

export interface LevelResult {
    levelId: number;
    score: number;
    speedScore: number;
    accuracyScore: number;
    comboScore: number;
    correctCount: number;
    wrongCount: number;
    maxCombo: number;
    totalTime: number;
    starCount: number;
    passed: boolean;
}
