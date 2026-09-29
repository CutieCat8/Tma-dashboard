import React from "react";

export function DeleteMeetingDialog({ meeting, onCancel, onConfirm }) {
  if (!meeting) return null;
  return (
    <div className="t-modal-backdrop" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="t-modal" onClick={(event) => event.stopPropagation()}>
        <div className="t-modal-head"><div><h3 className="t-card-title">ลบนัดหมายนี้?</h3><p className="t-card-sub">{meeting.title}</p></div></div>
        <p className="ann-confirm-text">นักเรียนที่ถูกนัดจะไม่เห็นนัดนี้ในปฏิทินอีก</p>
        <div className="t-modal-actions">
          <button type="button" className="t-btn-ghost" onClick={onCancel}>ยกเลิก</button>
          <button type="button" className="t-btn-danger" onClick={onConfirm}>ลบนัด</button>
        </div>
      </div>
    </div>
  );
}

export function AvailabilityDetailDialog({ availability, studentName, getCourseById, onVerify, onClose }) {
  if (!availability) return null;
  return (
    <div className="t-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="t-modal availability-detail-modal" role="dialog" aria-modal="true" aria-labelledby="availability-detail-title">
        <div className="t-modal-head">
          <div><h3 id="availability-detail-title" className="t-card-title">{studentName}</h3><p className="t-card-sub">{availability.status === "busy" ? "ไม่ว่างในช่วงเวลานี้" : "ว่างในช่วงเวลานี้"}</p></div>
          <button type="button" className="t-btn-ghost" onClick={onClose}>ปิด</button>
        </div>
        <div className="availability-conflict-list">
          {availability.conflicts.length === 0 ? <p className="meet-empty">ไม่พบรายการที่ชนกัน</p> : availability.conflicts.map((conflict, index) => {
            const course = conflict.type === "course" ? getCourseById(conflict.occurrence.courseId) : null;
            return (
              <article className="availability-conflict-card" key={`${conflict.type}-${index}`}>
                <span>{conflict.type === "course" ? "COURSE" : "MEETING"}</span>
                <h4>{conflict.type === "course" ? `${conflict.occurrence.courseCode} · ${conflict.occurrence.courseName}` : conflict.meeting.title}</h4>
                <p>{conflict.startTime} - {conflict.endTime}{conflict.type === "course" && conflict.occurrence.location ? ` · ${conflict.occurrence.location}` : ""}</p>
                {course && <>
                  <p className={`verification-status is-${course.verificationStatus}`}>{course.verificationStatus === "verified" ? "Verified" : course.verificationStatus === "needs-review" ? "Needs review" : "Self-reported"}</p>
                  {course.notes && <p>{course.notes}</p>}
                  <div className="availability-verify-actions">
                    <button type="button" onClick={() => onVerify(course.id, "verified")}>Mark verified</button>
                    <button type="button" onClick={() => onVerify(course.id, "needs-review")}>Needs review</button>
                  </div>
                </>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
