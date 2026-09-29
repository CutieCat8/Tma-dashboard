import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSheet, SHEETS, clearSheetCache } from "@/features/consistency/sheets";
import { buildStudentStats } from "@/features/consistency/consistency";

export function useSheetData({ studentId, role }) {
  const [medSheet, setMedSheet] = useState(null);
  const [journalSheet, setJournalSheet] = useState(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsError, setSheetsError] = useState(null);

  const fetchSheets = useCallback(async ({ force = false } = {}) => {
    setSheetsLoading(true);
    setSheetsError(null);
    try {
      const [med, journal] = await Promise.all([
        fetchSheet(SHEETS.meditation.id, SHEETS.meditation.gid, { force }),
        fetchSheet(SHEETS.journalTracking.id, SHEETS.journalTracking.gid, { force }),
      ]);
      setMedSheet(med);
      setJournalSheet(journal);
    } catch (error) {
      console.error("Failed to fetch sheets:", error);
      setSheetsError(error.message || "Unable to load sheet data");
    } finally {
      setSheetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId && role === "student") fetchSheets();
  }, [fetchSheets, role, studentId]);

  const refreshSheets = useCallback(() => {
    clearSheetCache();
    return fetchSheets({ force: true });
  }, [fetchSheets]);

  const consistency = useMemo(() => {
    if (!medSheet || !journalSheet || !studentId) return null;
    return buildStudentStats({ medSheet, journalSheet, studentId });
  }, [journalSheet, medSheet, studentId]);

  return { medSheet, journalSheet, sheetsLoading, sheetsError, refreshSheets, consistency };
}
