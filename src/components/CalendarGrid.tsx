import React, { useState } from "react";
import { type CalendarTask } from "../lib/storage";

interface CalendarGridProps {
  tasks: CalendarTask[];
  activeWeekMonday: Date;
  onToggleComplete: (id: string) => void;
  onTaskClick: (task: CalendarTask) => void;
  onAddTask: (title: string, dateStr: string) => void;
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;
  onMoveTask: (id: string, targetDateStr: string) => void;
  dayPhotos: { [dateStr: string]: string };
  onUploadPhoto: (dateStr: string, base64: string) => void;
  onDeletePhoto: (dateStr: string) => void;
  textWrappingEnabled: boolean;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tasks,
  activeWeekMonday,
  onToggleComplete,
  onTaskClick,
  onAddTask,
  draggedTaskId,
  setDraggedTaskId,
  onMoveTask,
  dayPhotos,
  onUploadPhoto,
  onDeletePhoto,
  textWrappingEnabled,
}) => {
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);
  const [newTitleByDay, setNewTitleByDay] = useState<{ [dateStr: string]: string }>({});

  const todayStr = new Date().toISOString().split("T")[0];

  const getWeekDays = () => {
    const days = [];
    const weekdaysNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(activeWeekMonday);
      d.setDate(activeWeekMonday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString("default", { month: "short" });
      
      days.push({
        dateStr,
        label: `${dayNum} ${monthShort}`,
        dayName: weekdaysNames[i],
        isToday: dateStr === todayStr,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleInputChange = (dateStr: string, val: string) => {
    setNewTitleByDay((prev) => ({ ...prev, [dateStr]: val }));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, dateStr: string) => {
    if (e.key === "Enter") {
      const title = newTitleByDay[dateStr] || "";
      if (title.trim()) {
        onAddTask(title.trim(), dateStr);
        setNewTitleByDay((prev) => ({ ...prev, [dateStr]: "" }));
      }
    }
  };

  // Canvas image compression helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, dateStr: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Force a square crop and resize to max 150px to protect Local Storage quotas
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Calculate crop parameters
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        // Compress image to JPEG at 85% quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        onUploadPhoto(dateStr, compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="calendar-week-grid font-typewriter">
      {weekDays.map((day) => {
        const dayTasks = tasks.filter((t) => t.date === day.dateStr);
        const photo = dayPhotos[day.dateStr];

        return (
          <div
            key={day.dateStr}
            className="calendar-day-column"
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedOverDay !== day.dateStr) {
                setDraggedOverDay(day.dateStr);
              }
            }}
            onDragLeave={() => {
              if (draggedOverDay === day.dateStr) {
                setDraggedOverDay(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDraggedOverDay(null);
              if (draggedTaskId) {
                onMoveTask(draggedTaskId, day.dateStr);
              }
            }}
          >
            {draggedOverDay === day.dateStr && (
              <div className="column-drop-overlay" />
            )}

            {/* Column Header */}
            <div className={`day-column-header ${day.isToday ? "active-today" : ""}`}>
              <span className="day-header-date">{day.label}</span>
              <span className="day-header-name">{day.dayName}</span>
            </div>

            {/* Lined Notebook Area */}
            <div className="day-column-entries">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onClick={() => onTaskClick(task)}
                  className={`calendar-task-item ${task.completed ? "completed" : ""} ${
                    textWrappingEnabled ? "text-wrap" : ""
                  }`}
                >
                  <span className="task-title">
                    {task.color && task.color !== "none" ? (
                      <span className={`task-pill tag-${task.color}`}>{task.title}</span>
                    ) : (
                      task.title
                    )}
                  </span>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task.id);
                    }}
                    className="task-check-hover-zone"
                    title="Toggle complete"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {task.completed ? (
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      ) : (
                        <circle cx="12" cy="12" r="10" />
                      )}
                      {task.completed && <polyline points="22 4 12 14.01 9 11.01" />}
                    </svg>
                  </div>
                </div>
              ))}

              {/* Invisible ruled input line */}
              <div className="calendar-task-item" style={{ cursor: "default" }}>
                <input
                  type="text"
                  value={newTitleByDay[day.dateStr] || ""}
                  onChange={(e) => handleInputChange(day.dateStr, e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, day.dateStr)}
                  placeholder="+ Add item..."
                  className="quick-add-task-input"
                />
              </div>

              {/* Polaroid Memory Photo Container (Pushed to bottom of day column) */}
              <div className="day-polaroid-wrapper">
                {photo ? (
                  <div className="day-polaroid-card">
                    <img src={photo} alt="Memory" className="day-polaroid-img" />
                    <span className="day-polaroid-caption">{day.label}</span>
                    <button
                      onClick={() => onDeletePhoto(day.dateStr)}
                      className="day-polaroid-delete-btn"
                      title="Delete Memory Photo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="day-polaroid-camera-btn" title="Add Memory Photo">
                      <svg viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, day.dateStr)}
                        style={{ display: "none" }}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
