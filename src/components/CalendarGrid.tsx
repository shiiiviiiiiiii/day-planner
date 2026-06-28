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
}) => {
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);
  
  // State to hold temporary typed text for inline add per day
  const [newTitleByDay, setNewTitleByDay] = useState<{ [dateStr: string]: string }>({});

  const todayStr = new Date().toISOString().split("T")[0];

  // Helper to generate the 7 days of the week from the active Monday
  const getWeekDays = () => {
    const days = [];
    const weekdaysNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(activeWeekMonday);
      d.setDate(activeWeekMonday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      // format day label like "22 Jun"
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

  return (
    <div className="calendar-week-grid font-typewriter">
      {weekDays.map((day) => {
        // Filter tasks scheduled for this day
        const dayTasks = tasks.filter((t) => t.date === day.dateStr);

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
                  className={`calendar-task-item ${task.completed ? "completed" : ""}`}
                >
                  {/* Task label (with tag colors if set) */}
                  <span className="task-title">
                    {task.color && task.color !== "none" ? (
                      <span className={`task-pill tag-${task.color}`}>{task.title}</span>
                    ) : (
                      task.title
                    )}
                  </span>

                  {/* Hover check box zone */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering open modal click
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

              {/* Invisible ruled input line for adding new task */}
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
