import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return await response.json();
}

export async function register(data: RegistrationData): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/register", data);
  return await response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });
    
    if (response.status === 401) {
      return null;
    }
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export function isAdmin(user: User | null): boolean {
  return !!user && user.role === "admin";
}

export function isWorkshopManager(user: User | null): boolean {
  return !!user && (user.role === "admin" || user.role === "workshop_manager");
}

export function isTechnician(user: User | null): boolean {
  return !!user && (user.role === "admin" || user.role === "workshop_manager" || user.role === "technician");
}
