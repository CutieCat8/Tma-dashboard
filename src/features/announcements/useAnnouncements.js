import { useCallback } from "react";

export function useAnnouncements(setData) {
  const addAnnouncement = useCallback((payload) => {
    setData((previous) => {
      const announcement = {
        id: Date.now(),
        title: payload.title?.trim() || "ประกาศ",
        description: payload.description?.trim() || "",
        category: payload.category || "ประกาศ",
        dateStart: payload.dateStart || "",
        dateEnd: payload.dateEnd || "",
        startTime: payload.startTime || "",
        endTime: payload.endTime || "",
        time: payload.startTime && payload.endTime ? `${payload.startTime} - ${payload.endTime}` : payload.time?.trim() || "",
        location: payload.location?.trim() || "",
        attendees: payload.attendees?.trim() || "",
        createdAt: new Date().toISOString(),
        read: false,
      };
      return { ...previous, announcements: [announcement, ...previous.announcements] };
    });
  }, [setData]);

  const removeAnnouncement = useCallback((id) => setData((previous) => ({
    ...previous,
    announcements: previous.announcements.filter((item) => item.id !== id),
  })), [setData]);

  const updateAnnouncement = useCallback((id, payload) => setData((previous) => ({
    ...previous,
    announcements: previous.announcements.map((item) => item.id === id ? {
      ...item,
      title: payload.title?.trim() || item.title,
      description: payload.description?.trim() ?? item.description,
      category: payload.category || item.category,
      dateStart: payload.dateStart ?? item.dateStart,
      dateEnd: payload.dateEnd ?? item.dateEnd,
      time: payload.time?.trim() ?? item.time,
      location: payload.location?.trim() ?? item.location,
      attendees: payload.attendees?.trim() ?? item.attendees,
      updatedAt: new Date().toISOString(),
    } : item),
  })), [setData]);

  const markAnnouncementRead = useCallback((id) => setData((previous) => ({
    ...previous,
    announcements: previous.announcements.map((item) => item.id === id ? { ...item, read: true } : item),
  })), [setData]);

  return { addAnnouncement, removeAnnouncement, updateAnnouncement, markAnnouncementRead };
}
