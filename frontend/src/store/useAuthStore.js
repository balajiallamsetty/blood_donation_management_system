import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setRole: (role) => set({ role }),

  logout: () => set({ user: null, token: null, role: null }),
}));

export default useAuthStore;
