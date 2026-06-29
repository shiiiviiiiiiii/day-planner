import React, { useState } from "react";
import { type CalendarTask } from "../lib/storage";

interface DumpListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: CalendarTask[];
  onToggleComplete: (id: string) => void;
  onTaskClick: (task: CalendarTask) => void;
  onAddTask: (title: string) => void;
  setDraggedTaskId: (id: string | null) => void;
}

export const DumpListDrawer: React.FC<DumpListDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleComplete,
  onTaskClick,
  onAddTask,
  setDraggedTaskId,
}) => {
  const [newNote, setNewNote] = useState("");

  if (!isOpen) return null;

  const dumpTasks = tasks.filter((t) => t.date === "dump");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newNote.trim()) {
      onAddTask(newNote.trim());
      setNewNote("");
    }
  };

  return (
    <div className="dump-list-overlay" onClick={onClose}>
      <div 
        className="dump-list-drawer font-typewriter" 
        onClick={(e) => e.stopPropagation()} // Prevent close on clicking drawer contents
      >
        {/* Drawer Header */}
        <div className="dump-drawer-header">
          <div className="dump-drawer-title">
            <span>📋</span> Dump List
          </div>
          <button onClick={onClose} className="dump-drawer-close-btn" title="Close Drawer">
            ✕
          </button>
        </div>

        <p className="dump-drawer-help italic">
          Scribble tasks or ideas here. Drag them onto any calendar column to schedule them.
        </p>

        {/* Ruled lines list */}
        <div className="dump-drawer-entries">
          {dumpTasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={() => setDraggedTaskId(task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              onClick={() => onTaskClick(task)}
              className={`calendar-task-item ${task.completed ? "completed" : ""}`}
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

          {/* Quick-add row inside drawer */}
          <div className="calendar-task-item" style={{ cursor: "default" }}>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="+ Add idea..."
              className="quick-add-task-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
