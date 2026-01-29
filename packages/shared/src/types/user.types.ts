export interface CreateUserDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    plan: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
