import { apiRequest } from "@/lib/api-client";
import type { AuthResponse, AuthUser } from "@/types/auth";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name?: string;
  display_name?: string;
  email: string;
  password: string;
  password_confirmation: string;
  date_of_birth: string;
  country?: string;
};

export async function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

export async function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

export async function logout() {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export async function me(token?: string) {
  const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
    method: "GET",
    tokenOverride: token,
  });
  return response.user;
}
