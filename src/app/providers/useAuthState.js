import { useCallback, useState } from "react";

export function useAuthState() {
  const [studentId, setStudentIdState] = useState(() => localStorage.getItem("tma_studentId") || "");
  const [role, setRoleState] = useState(() => localStorage.getItem("tma_role") || "");

  const setStudentId = useCallback((id) => {
    if (id) localStorage.setItem("tma_studentId", id);
    else localStorage.removeItem("tma_studentId");
    setStudentIdState(id || "");
  }, []);

  const setRole = useCallback((nextRole) => {
    if (nextRole) localStorage.setItem("tma_role", nextRole);
    else localStorage.removeItem("tma_role");
    setRoleState(nextRole || "");
  }, []);

  const logout = useCallback(() => {
    setStudentId("");
    setRole("");
  }, [setRole, setStudentId]);

  return { studentId, setStudentId, role, setRole, logout };
}
