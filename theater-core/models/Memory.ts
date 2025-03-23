export interface MemoryItem {
    timestamp: Date;
    content: string;
}

export class Memory {
    public items: MemoryItem[] = [];
    public scene: string = '';

    constructor(public size: number = 20) { }

    /**
     * Add a memory to the memory
     */
    public add(content: string) {
        this.items.push({ timestamp: new Date(), content });
        this.items = this.items.slice(-this.size); // Keep last N memories
    }

    /**
     * Set the current scene
     */
    public setScene(scene: string) {
        this.scene = scene;
    }

    /**
     * Get memories as a string
     */
    public getMemories(): string {
        return this.items.map(m => `${m.timestamp.toTimeString()} - ${m.content}`).join('\n');
    }

    /**
     * Ger memories as an array
     */
    public getMemoriesArray(): MemoryItem[] {
        return [...this.items];
    }
}