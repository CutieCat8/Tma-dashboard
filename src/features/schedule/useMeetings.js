import { useCallback } from "react";

function meetingMatchesStudent(meeting, studentId) {
  if (!studentId || meeting.attendeeMode === "all") return true;
  const attendeeIds = meeting.attendeeStudentIds ?? meeting.studentIds ?? [];
  return attendeeIds.includes(studentId);
}

export function useMeetings({ data, setData }) {
  const addMeeting = useCallback((payload) => {
    setData((previous) => {
      const meeting = {
        id: `m-${Date.now()}`,
        date: payload.date || "",
        startTime: payload.startTime || "",
        endTime: payload.endTime || "",
        time: payload.startTime && payload.endTime ? `${payload.startTime} - ${payload.endTime}` : payload.time?.trim() || "",
        title: payload.title?.trim() || "นัดประชุม",
        location: payload.location?.trim() || "",
        description: payload.description?.trim() || "",
        attendeeMode: payload.attendeeMode === "students" ? "students" : "all",
        studentIds: Array.isArray(payload.studentIds) ? [...payload.studentIds] : [],
        attendeeStudentIds: Array.isArray(payload.attendeeStudentIds)
          ? [...payload.attendeeStudentIds]
          : Array.isArray(payload.studentIds) ? [...payload.studentIds] : [],
        overrideReason: payload.overrideReason?.trim() || "",
        createdAt: new Date().toISOString(),
      };
      return { ...previous, meetings: [...previous.meetings, meeting] };
    });
  }, [setData]);

  const removeMeeting = useCallback((id) => setData((previous) => ({
    ...previous,
    meetings: previous.meetings.filter((meeting) => meeting.id !== id),
  })), [setData]);

  const updateMeeting = useCallback((id, payload) => setData((previous) => ({
    ...previous,
    meetings: previous.meetings.map((meeting) => meeting.id === id ? {
      ...meeting,
      date: payload.date || meeting.date,
      startTime: payload.startTime ?? meeting.startTime ?? "",
      endTime: payload.endTime ?? meeting.endTime ?? "",
      time: payload.startTime && payload.endTime ? `${payload.startTime} - ${payload.endTime}` : payload.time?.trim() ?? meeting.time,
      title: payload.title?.trim() || meeting.title,
      location: payload.location?.trim() ?? meeting.location,
      description: payload.description?.trim() ?? meeting.description,
      attendeeMode: payload.attendeeMode === "students" ? "students" : "all",
      studentIds: Array.isArray(payload.studentIds) ? [...payload.studentIds] : meeting.studentIds,
      attendeeStudentIds: Array.isArray(payload.attendeeStudentIds) ? [...payload.attendeeStudentIds] : meeting.attendeeStudentIds,
      overrideReason: payload.overrideReason?.trim() ?? meeting.overrideReason ?? "",
      updatedAt: new Date().toISOString(),
    } : meeting),
  })), [setData]);

  const getMeetingsForDate = useCallback((date, studentId = null) => data.meetings.filter(
    (meeting) => meeting.date === date && (studentId === null || meetingMatchesStudent(meeting, studentId))
  ), [data.meetings]);

  const getMeetingsForStudent = useCallback(
    (studentId) => data.meetings.filter((meeting) => meetingMatchesStudent(meeting, studentId)),
    [data.meetings]
  );

  return { addMeeting, removeMeeting, updateMeeting, getMeetingsForDate, getMeetingsForStudent };
}
