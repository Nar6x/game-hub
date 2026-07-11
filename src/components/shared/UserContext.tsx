"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from "react";

interface UserContextType {
  username: string;
  setUsername: (name: string) => void;
  isSet: boolean;
}

const UserContext = createContext<UserContextType>({
  username: "",
  setUsername: () => {},
  isSet: false,
});

const STORAGE_KEY = "gamehub_username";
const storageListeners = new Set<() => void>();

function emitStorageChange() {
  storageListeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  storageListeners.add(callback);
  return () => {
    storageListeners.delete(callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

function getServerSnapshot() {
  return "";
}

export function UserProvider({ children }: { children: ReactNode }) {
  const username = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isSet = username.length > 0;

  const setUsername = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    emitStorageChange();
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, isSet }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
