import { createSlice } from "@reduxjs/toolkit";

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadStoredSession = () => {
  try {
    const raw = localStorage.getItem("auth-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token") ?? null,
  tokenExpiration: localStorage.getItem("token-expiration")
    ? Number(localStorage.getItem("token-expiration"))
    : null,
  role: localStorage.getItem("role") ?? null,
  user: loadStoredUser(),
  session: loadStoredSession(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, tokenExpiration, role, user, session } = action.payload || {};

      if (token !== undefined) {
        state.token = token;
        if (token === null) {
          localStorage.removeItem("token");
        } else {
          localStorage.setItem("token", token);
        }
      }

      if (tokenExpiration !== undefined) {
        state.tokenExpiration = tokenExpiration;
        if (tokenExpiration === null) {
          localStorage.removeItem("token-expiration");
        } else {
          localStorage.setItem("token-expiration", String(tokenExpiration));
        }
      }

      if (role !== undefined) {
        state.role = role;
        if (role === null) {
          localStorage.removeItem("role");
        } else {
          localStorage.setItem("role", role);
        }
      }

      if (user !== undefined) {
        state.user = user;
        if (user === null) {
          localStorage.removeItem("auth-user");
        } else {
          localStorage.setItem("auth-user", JSON.stringify(user));
        }
      }

      if (session !== undefined) {
        state.session = session;
        if (session === null) {
          localStorage.removeItem("auth-session");
        } else {
          localStorage.setItem("auth-session", JSON.stringify(session));
        }
      }
    },
    clearCredentials: (state) => {
      state.token = null;
      state.tokenExpiration = null;
      state.role = null;
      state.user = null;
      state.session = null;
      localStorage.removeItem("token");
      localStorage.removeItem("token-expiration");
      localStorage.removeItem("role");
      localStorage.removeItem("auth-user");
      localStorage.removeItem("auth-session");
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const selectAuthToken = (state) => state.auth.token;
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthRole = (state) => state.auth.role;
export const selectAuthSession = (state) => state.auth.session;

export default authSlice.reducer;

