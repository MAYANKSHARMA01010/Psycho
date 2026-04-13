"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";

export type AuthRole = "CLIENT" | "THERAPIST" | "ADMIN";

export type AuthUser = {
    email: string;
    role: AuthRole;
};

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (payload: AuthUser) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            login: (payload) => setUser(payload),
            logout: () => setUser(null),
        }),
        [user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
