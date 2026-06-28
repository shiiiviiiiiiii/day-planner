import React, { useState } from "react";
import { type CalendarTask } from "../lib/storage";

interface SomedaySectionProps {
  tasks: CalendarTask[];
  onToggleComplete: (id: string) => void;
  onTaskClick: (task: CalendarTask) => void;
  onAddTask: (title: string) => void;
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;
  onMoveTask: (id: string, targetDateStr: string) => void;
}

export const SomedaySection: React.FC<SomedaySectionProps> = ({
  tasks,
  onToggleComplete,
  onTaskClick,
  onAddTask,
  draggedTaskId,
  setDraggedTaskId,
  onMoveTask,
}) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const somedayTasks = tasks.filter((t) => t.date === "someday");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTitle.trim()) {
      onAddTask(newTitle.trim());
      setNewTitle("");
    }
  };

  return (
    <div className="someday-section-container font-typewriter">
      <h3 className="someday-header">Someday</h3>

      <div
        className="someday-grid-ruled"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDraggedOver) setIsDraggedOver(true);
        }}
        onDragLeave={() => {
          if (isDraggedOver) setIsDraggedOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggedOver(false);
          if (draggedTaskId) {
            onMoveTask(draggedTaskId, "someday");
          }
        }}
      >
        {isDraggedOver && (
          <div className="column-drop-overlay" style={{ background: "rgba(0,0,0,0.02)" }} />
        )}

        {somedayTasks.map((task) => (
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

        {/* Quick add line */}
        <div className="calendar-task-item" style={{ cursor: "default" }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ Add item..."
            className="quick-add-task-input"
          />
        </div>
      </div>
    </div>
  );
};
