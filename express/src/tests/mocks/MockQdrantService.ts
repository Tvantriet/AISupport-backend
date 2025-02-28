export default class MockQdrantService {
    private collections: Map<string, any> = new Map();

    public async collectionExists(name: string): Promise<boolean> {
        return this.collections.has(name);
    }

    public async createCollection(name: string, dimension: number): Promise<void> {
        this.collections.set(name, {
            name,
            dimension,
            points: []
        });
    }

    public async addPoints(collectionName: string, points: any[]): Promise<any> {
        if (!this.collections.has(collectionName)) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }
        
        const collection = this.collections.get(collectionName);
        collection.points.push(...points);
        
        return { 
            status: 'success', 
            added: points.length 
        };
    }

    public async deleteCollection(name: string): Promise<void> {
        this.collections.delete(name);
    }

    public async search(collectionName: string, vector: number[], limit: number = 10): Promise<any[]> {
        if (!this.collections.has(collectionName)) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }
        
        const collection = this.collections.get(collectionName);
        
        // Simple mock implementation that returns random points
        return collection.points
            .slice(0, Math.min(limit, collection.points.length))
            .map((point: any) => ({
                ...point,
                score: Math.random()
            }))
            .sort((a: any, b: any) => b.score - a.score);
    }
} 