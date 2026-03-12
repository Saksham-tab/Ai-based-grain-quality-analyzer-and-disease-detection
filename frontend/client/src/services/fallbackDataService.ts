// Fallback Data Service - Used when APIs are unavailable
import { GrainData } from '../types';

export const fallbackDataService = {
    /**
     * Default mock grain data when API fails
     */
    getDefaultGrainData(): GrainData {
        return {
            _id: 'mock-default',
            purity: 87.5,
            temperature: 28.6,
            moisture: 13.0,
            humidity: 62.0,
            grade: 'B',
            impurities: {
                husk: 3.2,
                stones: 1.9,
                brokenPieces: 4.1,
                insectDamage: 0.7,
                blackSpots: 1.1,
                discolored: 1.3,
            },
            aiOutputs: {
                price: {
                    value: 4850,
                    error: null,
                },
                shelfLife: {
                    value: 8,
                    unit: 'months',
                    error: null,
                },
                advisory: {
                    text: 'Based on current purity levels at 87.5%, your grain quality is in the Medium Grade range. [Using fallback data - API unavailable]',
                },
            },
            sensorSnapshot: {
                temperature: 28.6,
                humidity: 62.0,
                moisture: 13.0,
            },
            createdAt: new Date().toISOString(),
        };
    },

    /**
     * Fallback sensor data for real-time updates
     */
    getDefaultSensorData() {
        return {
            temperature: 28.6,
            humidity: 62.0,
            moisture: 13.0,
        };
    },

    /**
     * Fallback AI outputs when agents fail
     */
    getDefaultAIOutputs() {
        return {
            price: {
                value: null,
                error: 'Price agent unavailable - using fallback',
            },
            shelfLife: {
                value: null,
                unit: 'days',
                error: 'Shelf-life agent unavailable - using fallback',
            },
            advisory: {
                text: '⚠️ Advisory agent unavailable. Ensure proper storage conditions: Keep temperature between 15-25°C, humidity below 65%, and moisture content below 12%.',
            },
        };
    },
};

export default fallbackDataService;
