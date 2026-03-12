export interface GrainData {
    _id?: string;
    reportId?: string;
    purity: number;
    temperature: number;
    moisture: number;
    humidity: number;
    grade?: 'A' | 'B' | 'C';
    impurities: {
        husk: number;
        stones: number;
        brokenPieces: number;
        insectDamage: number;
        blackSpots: number;
        discolored: number;
    };
    aiOutputs?: {
        price?: {
            value: number | null;
            market?: string;
            date?: string;
            decision?: string;
            error: string | null;
        };
        shelfLife?: {
            value: number | null;
            unit: string;
            risk?: string;
            paragraph?: string;
            error: string | null;
        };
        advisory?: {
            text: string;
        };
    };
    sensorSnapshot?: {
        temperature: number;
        humidity: number;
        moisture: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface GradeInfo {
    grade: 'A' | 'B' | 'C';
    label: string;
    color: string;
    bgColor: string;
}

export interface AIAnalysis {
    advisory: string;
    pricing: number;
    shelfLife: number;
    shelfLifeUnit: string;
}
