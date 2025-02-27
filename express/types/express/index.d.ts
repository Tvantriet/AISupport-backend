// Modify Request for Firebase Authentication
declare namespace Express {
    export interface Request {
        authId: string | null,
        userId: number | null
    }
}
