//this class will return two things the primary model and the secondary model
//get the primary and secondary model from the environment variables
//CURRENTLY NOT IN USE DO NOT MAKE EDITS TO THIS FILE!

export default class ModelSelectionService {
    public getPrimaryModel(): string {
        return process.env.PRIMARY_MODEL || 'gpt-4o-mini';
    }

    public getSecondaryModel(): string {
        return process.env.SECONDARY_MODEL || 'gpt-4o-mini';
    }

    public getEmbeddingModel(): string {
        return process.env.EMBEDDING_MODEL || 'text-embedding-3-large';
    }
}