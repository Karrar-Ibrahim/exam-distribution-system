"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUserData,
  getAbilities,
  clearAuthData,
  checkAbility,
} from "@/lib/auth";
import type { UserData, UserAbility } from "@/types";

interface AuthState {
  user:      UserData | null;
  abilities: UserAbility[];
  loading:   boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user:      null,
    abilities: [],
    loading:   true,
  });

  useEffect(() => {
    setState({
      user:      getUserData(),
      abilities: getAbilities(),
      loading:   false,
    });
  }, []);

  /** Hard redirect + clear tokens */
  const logout = useCallback(() => {
    clearAuthData();
    window.location.replace("/login");
  }, []);

  /**
   * Check if the user can perform `action` on `subject`.
   * e.g. can("read", "classroom")
   */
  const can = useCallback(
    (action: string, subject: string): boolean =>
      checkAbility(action, subject, state.user, state.abilities),
    [state.user, state.abilities]
  );

  /**
   * Shorthand: can the user *see* a module in the sidebar?
   * Passes if super, or if the user has any ability for `module`.
   */
  const canSee = useCallback(
    (module?: string): boolean => {
      if (!module) return true;
      return checkAbility("read", module, state.user, state.abilities);
    },
    [state.user, state.abilities]
  );

  return {
    user:         state.user,
    abilities:    state.abilities,
    loading:      state.loading,
    logout,
    can,
    canSee,
    isSuperUser:  state.user?.role === "super",
    isAuthenticated: Boolean(state.user),
  };
}
