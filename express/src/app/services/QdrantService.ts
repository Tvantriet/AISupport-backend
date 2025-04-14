import qdrantClient from "../utils/qdrantClient.js";
//env

export default class QdrantService {
	private client;
	
	constructor(client = qdrantClient) {
		this.client = client;
	}
	
	/**
	 * Search for vectors in a collection
	 *
	 * @param collectionName The name of the collection to search in
	 * @param queryVector The query vector to search for
	 * @param limit The maximum number of results to return
	 * @param scoreThreshold Minimum similarity score (0-1) to include in results
	 * @returns The search results
	 */
	public async search(
		collectionName: string, 
		queryVector: number[], 
		limit = 20,
		scoreThreshold = 0.24
	) {
		console.log(`🔎 Searching in collection "${collectionName}" with ${queryVector.length} dimensional vector`);
		try {
			const response = await this.client.search(collectionName, {
				vector: queryVector,
				limit: limit,
				with_payload: true,
				score_threshold: scoreThreshold,
			});
			console.log(`✅ Found ${response.length} results above threshold ${scoreThreshold}`);
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
			await this.client.createCollection(name, {
				vectors: {
					size: dimension,
					distance: "Cosine",
				},
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
			await this.client.deleteCollection(name);
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
			const collections = await this.client.getCollections();
			return collections.collections.some((collection) => collection.name === name);
		} catch (error: any) {
			console.error("Error checking Qdrant collection:", error);
			throw new Error(`Failed to check Qdrant collection: ${error.message}`);
		}
	}

	/**
	 * Add points to a collection with automatic batching
	 *
	 * @param collectionName Name of the collection
	 * @param points Points to add
	 * @param batchSize Size of each batch (default: 100)
	 * @returns Result of the operation
	 */
	public async addPoints(
		collectionName: string,
		points: Array<{ id: string | number; vector: number[]; payload: any }>,
		batchSize = 100
	): Promise<any> {
		try {
			console.log(`🔄 Adding ${points.length} points to collection ${collectionName}`);
			
			// Split points into batches
			const batches = [];
			for (let i = 0; i < points.length; i += batchSize) {
				batches.push(points.slice(i, i + batchSize));
			}
			
			console.log(`📦 Split into ${batches.length} batches of max ${batchSize} points each`);
			
			// Process batches sequentially to avoid overwhelming Qdrant
			let totalUploaded = 0;
			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];
				console.log(`⏳ Uploading batch ${i+1}/${batches.length} (${batch.length} points)`);
				
				const result = await this.client.upsert(collectionName, {
					wait: true,
					points: batch,
				});
				
				totalUploaded += batch.length;
				console.log(`✅ Batch ${i+1} uploaded successfully (${totalUploaded}/${points.length} total)`);
			}
			
			return {
				success: true,
				pointsAdded: totalUploaded,
				message: `Added ${totalUploaded} points to collection ${collectionName}`,
			};
		} catch (error: any) {
			console.error("Error adding points to Qdrant:", error);
			throw new Error(`Failed to add points to Qdrant: ${error.message}`);
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
			await this.client.delete(collectionName, {
				points: pointIds,
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
			await this.client.updateCollection(name, settings);
		} catch (error: any) {
			console.error("Error updating Qdrant collection:", error);
			throw new Error(`Failed to update Qdrant collection: ${error.message}`);
		}
	}

	/**
	 * Get all collections
	 *
	 * @returns List of collections
	 */
	public async getCollections() {
		try {
			return await this.client.getCollections();
		} catch (error: any) {
			console.error("Error getting Qdrant collections:", error);
			throw new Error(`Failed to get Qdrant collections: ${error.message}`);
		}
	}
}
