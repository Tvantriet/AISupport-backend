import qdrantClient from "../utils/qdrantClient.js";

export default class QdrantService {
    /**
     * Search for vectors in a collection
     * 
     * @param collectionName The name of the collection to search in
     * @param queryVector The query vector to search for
     * @param limit The maximum number of results to return
     * @returns The search results
     */
    public async search(collectionName: string, queryVector: number[], limit: number = 10) {
        try {
            const response = await qdrantClient.search(collectionName, {
                vector: queryVector,
                limit: limit,
                with_payload: true
            });
            
            return response;
        } catch (error: any) {
            console.error("Error searching in Qdrant:", error);
            throw new Error(`Failed to search in Qdrant: ${error.message}`);
        }
    }

    /**
     * Create a new collection in Qdrant
     * 
     * @param name The name of the collection
     * @param dimension The dimension of the vectors
     */
    public async createCollection(name: string, dimension: number) {
        try {
            await qdrantClient.createCollection(name, {
                vectors: {
                    size: dimension,
                    distance: "Cosine"
                }
            });
        } catch (error: any) {
            console.error("Error creating Qdrant collection:", error);
            throw new Error(`Failed to create Qdrant collection: ${error.message}`);
        }
    }

    /**
     * Delete a collection from Qdrant
     * 
     * @param name The name of the collection to delete
     */
    public async deleteCollection(name: string) {
        try {
            await qdrantClient.deleteCollection(name);
        } catch (error: any) {
            console.error("Error deleting Qdrant collection:", error);
            throw new Error(`Failed to delete Qdrant collection: ${error.message}`);
        }
    }

    /**
     * Check if a collection exists in Qdrant
     * 
     * @param name The name of the collection to check
     * @returns True if the collection exists, false otherwise
     */
    public async collectionExists(name: string): Promise<boolean> {
        try {
            const collections = await qdrantClient.getCollections();
            return collections.collections.some(collection => collection.name === name);
        } catch (error: any) {
            console.error("Error checking Qdrant collection:", error);
            throw new Error(`Failed to check Qdrant collection: ${error.message}`);
        }
    }

    /**
     * Add multiple documents to a collection
     * 
     * @param collectionName The name of the collection
     * @param points Array of points to add
     * @returns Results of the operation
     */
    public async addPoints(collectionName: string, points: Array<{ id: string | number; vector: number[]; payload?: any }>) {
        try {
            const pointsmapped = points.map(doc => ({
                id: doc.id,
                vector: doc.vector,
                payload: doc.payload || {}
            }));
            
            const result = await qdrantClient.upsert(collectionName, {
                points: pointsmapped
            });
            
            return result;
        } catch (error: any) {
            console.error("Error adding documents to Qdrant:", error);
            throw new Error(`Failed to add documents to Qdrant: ${error.message}`);
        }
    }

    /**
     * Delete points from a collection
     * 
     * @param collectionName The name of the collection
     * @param pointIds Array of point IDs to delete
     */
    public async deletePoints(collectionName: string, pointIds: Array<string | number>) {
        try {
            await qdrantClient.delete(collectionName, {
                points: pointIds
            });
        } catch (error: any) {
            console.error("Error deleting points from Qdrant:", error);
            throw new Error(`Failed to delete points from Qdrant: ${error.message}`);
        }
    }

    /**
     * Update collection settings
     * 
     * @param name The name of the collection
     * @param settings The settings to update
     */
    public async updateCollection(name: string, settings: any) {
        try {
            await qdrantClient.updateCollection(name, settings);
        } catch (error: any) {
            console.error("Error updating Qdrant collection:", error);
            throw new Error(`Failed to update Qdrant collection: ${error.message}`);
        }
    }
} 