import { User } from "./auction";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    campus: string;
    phone?: string;
    password: string;
    confirmpassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface AuthResponse {
    status: string;
    accessToken: string;
    refreshToken?: string;
    user: User;
    roles: string[];
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken?: string;
}
export interface RegisterResponse {
    status: string;
    message: string;
    data: {
        id: string | string;
        email: string;
        roles: [];
        active: boolean;
    };
}

export interface Response {
    status: string;
    message: string;
    data: [];
}
