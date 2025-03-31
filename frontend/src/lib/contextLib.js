import { useContext, createContext } from "react";

const AppContext = createContext({
  isAuthenticated: false,
  userHasAuthenticated: () => {},
  currentUserRoles: [],
  setCurrentUserRoles: () => {},
  users: [],
  setUsers: () => {},
  tenant: null,
  setTenant: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}

export default AppContext;

