import React, { useState, useEffect } from "react";
import { type CalendarTask, type Subtask, plannerStorage } from "../lib/storage";
import { playCarriageReturnBell } from "../lib/audio";

interface TaskModalProps {
  task: CalendarTask;
  onClose: () => void;
  onUpdate: (updated: CalendarTask) => void;
  onDelete: (id: string) => void;
}

const COLORS = ["none", "yellow", "green", "blue", "pink"];

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Pomodoro Timer States
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (interval) clearInterval(interval);
            
            try {
              const audioSettings = plannerStorage.getAudioSettings();
              if (audioSettings.sound) {
                playCarriageReturnBell();
              }
            } catch (err) {
              console.error(err);
            }
            alert(`Timer finished for: "${title || "Untitled Task"}"! Take a break.`);
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, title]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date for modal header: e.g., "Mon, 22 Jun 2026"
  const getFormattedDate = () => {
    if (task.date === "someday") return "📅 Someday Task";
    try {
      const parts = task.date.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = d.toLocaleString("default", { weekday: "short" });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      return `📅 ${dayName}, ${dayNum} ${monthShort} ${year}`;
    } catch {
      return `📅 ${task.date}`;
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdate({ ...task, title: title.trim() });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== task.notes) {
      onUpdate({ ...task, notes });
    }
  };

  const handleToggleComplete = () => {
    const nextCompleted = !task.completed;
    onUpdate({ ...task, completed: nextCompleted });
  };

  const handleColorSelect = (color: string) => {
    onUpdate({ ...task, color });
    setShowColorPicker(false);
  };

  // Subtask actions
  const handleToggleSubtask = (subId: string) => {
    const updatedSubtasks = subtasks.map((sub) =>
      sub.id === subId ? { ...sub, completed: !sub.completed } : sub
    );
    setSubtasks(updatedSubtasks);
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const handleSubtaskTextChange = (subId: string, val: string) => {
    const updatedSubtasks = subtasks.map((sub) =>
      sub.id === subId ? { ...sub, title: val } : sub
    );
    setSubtasks(updatedSubtasks);
  };

  const handleSubtaskBlur = () => {
    onUpdate({ ...task, subtasks });
  };

  const handleAddSubtask = () => {
    const newSub: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      title: "",
      completed: false,
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    onUpdate({ ...task, subtasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    setSubtasks(updated);
    onUpdate({ ...task, subtasks: updated });
  };

  return (
    <div className="task-detail-modal-backdrop" onClick={onClose}>
      <div 
        className="task-detail-modal-card" 
        onClick={(e) => e.stopPropagation()} // Prevent close on clicking card itself
      >
        {/* Modal Controls Row */}
        <div className="modal-controls-row">
          <div className="modal-date-tag">{getFormattedDate()}</div>

          <div className="modal-actions-right">
            {/* Trash Delete button */}
            <button
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="modal-icon-action-btn"
              title="Delete task"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>

            {/* Repeat button */}
            <button
              type="button"
              onClick={() => alert("Task recurrence is mocked locally!")}
              className="modal-icon-action-btn"
              title="Toggle repeat"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {/* Color selection dot */}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="modal-icon-action-btn"
              title="Choose highlight color"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>

            {/* Notification bell */}
            <button
              type="button"
              onClick={() => alert("Notification alarms are mocked locally!")}
              className="modal-icon-action-btn"
              title="Set notification reminder"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Action options ... */}
            <button
              type="button"
              onClick={() => alert("Task options panel opened!")}
              className="modal-icon-action-btn"
              title="More options"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="modal-icon-action-btn"
              style={{ fontWeight: "bold", fontSize: "16px" }}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Color tags picker dropdown */}
        {showColorPicker && (
          <div className="color-picker-dropdown">
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => handleColorSelect(c)}
                className={`color-option-dot tag-${c}`}
                style={{
                  backgroundColor:
                    c === "none"
                      ? "#ffffff"
                      : c === "yellow"
                      ? "#fff59d"
                      : c === "green"
                      ? "#a5d6a7"
                      : c === "blue"
                      ? "#bae6fd"
                      : "#fbcfe8",
                }}
                title={c === "none" ? "Clear tag color" : `${c} tag`}
              />
            ))}
          </div>
        )}

        {/* Title and Complete check circle toggle */}
        <div className="modal-title-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="modal-title-input"
            placeholder="Untitled Task"
          />

          <button
            onClick={handleToggleComplete}
            className={`btn-complete-modal-toggle ${task.completed ? "completed" : ""}`}
            title={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed && (
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Pomodoro Timer Row */}
        <div className="modal-pomodoro-timer-row" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          padding: "8px 12px",
          borderRadius: "10px",
          fontSize: "13px",
          marginTop: "5px"
        }}>
          <span style={{ fontWeight: 500, color: "#475569" }}>⏱ Pomodoro Timer</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="font-mono" style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                border: 0,
                background: "#475569",
                color: "#fff",
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "bold"
              }}
            >
              {isTimerRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(1500);
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "transparent",
                color: "#475569",
                padding: "2px 6px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Text toolbar matching screenshot */}
        <div className="modal-text-editor-toolbar">
          <button type="button" className="toolbar-format-btn">H</button>
          <button type="button" className="toolbar-format-btn" style={{ fontWeight: 800 }}>B</button>
          <button type="button" className="toolbar-format-btn">⋮</button>
          <button type="button" className="toolbar-format-btn">≡</button>
          <button type="button" className="toolbar-format-btn">🔗</button>
        </div>

        {/* Text area for notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add some extra notes here..."
          className="modal-description-textarea"
        />

        {/* Nested subtasks checklist */}
        <div className="modal-subtasks-container">
          {subtasks.map((sub) => (
            <div key={sub.id} className="modal-subtask-item">
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => handleToggleSubtask(sub.id)}
                className="modal-subtask-checkbox"
              />
              <input
                type="text"
                value={sub.title}
                onChange={(e) => handleSubtaskTextChange(sub.id, e.target.value)}
                onBlur={handleSubtaskBlur}
                placeholder="Subtask..."
                className={`modal-subtask-title-input ${sub.completed ? "completed" : ""}`}
              />
              <button
                type="button"
                onClick={() => handleDeleteSubtask(sub.id)}
                className="modal-icon-action-btn"
                style={{ color: "#ef4444", padding: "2px" }}
                title="Remove subtask"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSubtask}
            className="btn-add-subtask-trigger"
          >
            ➕ Add subtask...
          </button>
        </div>
      </div>
    </div>
  );
};
