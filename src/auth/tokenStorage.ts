const ACCESS_KEY = "twofstock_access";
const REFRESH_KEY = "twofstock_refresh";

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  setAccess(access: string): void {
    localStorage.setItem(ACCESS_KEY, access);
  },

  setRefresh(refresh: string): void {
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
