// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import  api from "../lib/api";

type UserContextValue = {
  userId: number | null;
  loadingUser: boolean;
  error: string | null;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  loadingUser: true,
  error: null,
});

export const useUser = () => useContext(UserContext);

type UserIdResponse = { id: number };

const DEFAULT_USER_EMAIL =
  import.meta.env.VITE_DEFAULT_USER_EMAIL ?? "admin@livraria.com";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("bibliostock:userId");
    if (cached) {
      setUserId(Number(cached));
      setLoadingUser(false);
      return;
    }

    async function fetchUserId() {
      try {
        setLoadingUser(true);
        setError(null);
        const data = await api.get<UserIdResponse>(
          `/api/users/getIdByEmail/${encodeURIComponent(DEFAULT_USER_EMAIL)}`
        );
        setUserId(data.id);
        localStorage.setItem("bibliostock:userId", String(data.id));
      } catch (err) {
        console.error("Erro ao buscar userId", err);
        setError("Não foi possível carregar o usuário padrão.");
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUserId();
  }, []);

  return (
    <UserContext.Provider value={{ userId, loadingUser, error }}>
      {children}
    </UserContext.Provider>
  );
};
