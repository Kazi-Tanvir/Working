export interface CustomJWTSessionClaims {
    metadata?: {
        role?: "user" | "admin"
    }
}