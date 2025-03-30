import { Trait } from '../events/types';

export interface PerceptionRadius {
    sight: number;
    hearing: number;
    emotion: number;
}

export class Perception {
    public readonly radius: PerceptionRadius;
    private readonly baseRadius = 5;
    private readonly minRadius = 0;
    private readonly maxRadius = 200;

    constructor(
        public readonly traits: Trait[] = []
    ) {
        this.radius = this.calculateRadius();
    }

    private calculateRadius(): PerceptionRadius {
        let sight = this.baseRadius;
        let hearing = this.baseRadius;
        let emotion = this.baseRadius;

        // Trait modifiers
        for (const trait of this.traits) {
            switch (trait) {
                // Perception traits
                case 'perceptive':
                    sight += 3;
                    hearing += 3;
                    break;
                case 'oblivious':
                    sight -= 2;
                    hearing -= 2;
                    break;

                // Emotional traits
                case 'empath':
                    emotion += 3;
                    break;
                case 'stoic':
                    emotion -= 2;
                    break;

                // Combined traits
                case 'aware':
                    sight += 2;
                    hearing += 2;
                    emotion += 2;
                    break;
                case 'unaware':
                    sight -= 2;
                    hearing -= 2;
                    emotion -= 2;
                    break;
            }
        }

        // Clamp values to the min and max radius
        return {
            sight: Math.max(this.minRadius, Math.min(this.maxRadius, sight)),
            hearing: Math.max(this.minRadius, Math.min(this.maxRadius, hearing)),
            emotion: Math.max(this.minRadius, Math.min(this.maxRadius, emotion))
        };
    }
} 