import { useEffect, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { CalendarGrid } from "./components/CalendarGrid";
import { SomedaySection } from "./components/SomedaySection";
import { TaskModal } from "./components/TaskModal";
import { type CalendarTask, plannerStorage } from "./lib/storage";
import { playTypewriterClick, playCarriageReturnBell, playAmbientMusic, stopAmbientMusic } from "./lib/audio";

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [activeWeekMonday, setActiveWeekMonday] = useState<Date>(getMonday(new Date()));
  const [audioSettings, setAudioSettings] = useState({ music: false, sound: false });

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modal active task
  const [activeModalTask, setActiveModalTask] = useState<CalendarTask | null>(null);

  // Shared Calendar state
  const [sharedTasks, setSharedTasks] = useState<CalendarTask[] | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Check for shared calendar link in URL params
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get("share");
    if (shareData) {
      try {
        const decoded = atob(shareData);
        const parsed = JSON.parse(decoded) as CalendarTask[];
        if (Array.isArray(parsed)) {
          setSharedTasks(parsed);
          setIsSharedMode(true);
        }
      } catch (err) {
        console.error("Failed to parse shared calendar data", err);
      }
    }

    // 2. Load auth session
    const user = plannerStorage.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      setTasks(plannerStorage.getTasks());
    }

    setAudioSettings(plannerStorage.getAudioSettings());
    setIsLoaded(true);

    const handleStorageUpdate = () => {
      setCurrentUser(plannerStorage.getCurrentUser());
      if (plannerStorage.getCurrentUser()) {
        setTasks(plannerStorage.getTasks());
      }
    };

    window.addEventListener("planner-storage-update", handleStorageUpdate);
    return () => {
      window.removeEventListener("planner-storage-update", handleStorageUpdate);
      stopAmbientMusic();
    };
  }, []);

  // Handle successful login/signup
  const handleAuthSuccess = () => {
    const user = plannerStorage.getCurrentUser();
    setCurrentUser(user);
    setTasks(plannerStorage.getTasks());
  };

  const handleLogout = () => {
    plannerStorage.logout();
    setCurrentUser(null);
    setTasks([]);
    setActiveModalTask(null);
  };

  // Navigations
  const handlePrevWeek = () => {
    const prev = new Date(activeWeekMonday);
    prev.setDate(activeWeekMonday.getDate() - 7);
    setActiveWeekMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(activeWeekMonday);
    next.setDate(activeWeekMonday.getDate() + 7);
    setActiveWeekMonday(next);
  };

  const handleTodayNav = () => {
    setActiveWeekMonday(getMonday(new Date()));
  };

  // Task Operations
  const handleToggleComplete = (id: string) => {
    if (audioSettings.sound) {
      playTypewriterClick();
    }

    const currentList = isSharedMode && sharedTasks ? sharedTasks : tasks;
    const updated = currentList.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted && audioSettings.sound) {
          setTimeout(() => playCarriageReturnBell(), 200);
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });

    if (isSharedMode) {
      setSharedTasks(updated);
    } else {
      setTasks(updated);
      plannerStorage.saveTasks(updated);
    }
  };

  const handleAddTask = (title: string, dateStr: string) => {
    if (isSharedMode) return;
    const newTask = plannerStorage.addTask(title, dateStr);
    setTasks((prev) => [...prev, newTask]);
  };

  const handleAddSomedayTask = (title: string) => {
    if (isSharedMode) return;
    const newTask = plannerStorage.addTask(title, "someday");
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: CalendarTask) => {
    const currentList = isSharedMode && sharedTasks ? sharedTasks : tasks;
    const updated = currentList.map((t) => (t.id === updatedTask.id ? updatedTask : t));

    if (isSharedMode) {
      setSharedTasks(updated);
    } else {
      setTasks(updated);
      plannerStorage.saveTasks(updated);
    }

    // Keep active modal in sync
    if (activeModalTask && activeModalTask.id === updatedTask.id) {
      setActiveModalTask(updatedTask);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (isSharedMode) {
      if (sharedTasks) {
        setSharedTasks(sharedTasks.filter((t) => t.id !== id));
      }
      return;
    }
    plannerStorage.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMoveTask = (id: string, targetDateStr: string) => {
    if (isSharedMode) return;
    const currentList = tasks;
    const updated = currentList.map((t) => {
      if (t.id === id) {
        return { ...t, date: targetDateStr };
      }
      return t;
    });
    setTasks(updated);
    plannerStorage.saveTasks(updated);
  };

  // Import shared calendar tasks
  const handleImportShared = () => {
    if (!sharedTasks) return;
    const merged = [...tasks];
    // Avoid double imports by filtering duplicates
    sharedTasks.forEach((sTask) => {
      if (!merged.some((m) => m.title === sTask.title && m.date === sTask.date)) {
        merged.push({
          ...sTask,
          id: Math.random().toString(36).substring(2, 9), // Assign fresh local ID
        });
      }
    });
    setTasks(merged);
    plannerStorage.saveTasks(merged);
    setIsSharedMode(false);
    setSharedTasks(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    alert("Shared calendar tasks have been imported into your notebook!");
  };

  const handleCancelSharedView = () => {
    setIsSharedMode(false);
    setSharedTasks(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Generate Base64 Share Link for active week
  const handleShareCalendar = () => {
    const weekDaysStrs: string[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(activeWeekMonday);
      d.setDate(activeWeekMonday.getDate() + i);
      weekDaysStrs.push(d.toISOString().split("T")[0]);
    }

    // Grab tasks scheduled for the currently viewed week + someday tasks
    const tasksToShare = tasks.filter(
      (t) => weekDaysStrs.includes(t.date) || t.date === "someday"
    );

    const json = JSON.stringify(tasksToShare);
    const base64 = btoa(unescape(encodeURIComponent(json))); // Unicode-safe Base64 encoding
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${base64}`;

    navigator.clipboard.writeText(shareUrl).then(
      () => {
        alert("Share link copied! Send this link to friends so they can view and import your calendar. 🔗");
      },
      () => {
        alert(`Failed to copy automatically. Copy this URL:\n${shareUrl}`);
      }
    );
  };

  const handleMusicToggle = () => {
    const nextMusic = !audioSettings.music;
    const updated = { music: nextMusic, sound: audioSettings.sound };
    plannerStorage.saveAudioSettings(updated);
    setAudioSettings(updated);
    if (nextMusic) {
      playAmbientMusic();
    } else {
      stopAmbientMusic();
    }
  };

  const handleSoundToggle = () => {
    const nextSound = !audioSettings.sound;
    const updated = { music: audioSettings.music, sound: nextSound };
    plannerStorage.saveAudioSettings(updated);
    setAudioSettings(updated);
  };

  // Format month and year header (e.g. "June 2026")
  const getHeaderMonthYear = () => {
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    return activeWeekMonday.toLocaleDateString("default", options);
  };

  if (!isLoaded) {
    return (
      <div className="desk-surface">
        <div style={{ fontStyle: "italic", textAlign: "center", marginTop: "10%" }}>
          Unfolding notebook calendar...
        </div>
      </div>
    );
  }

  const activeTaskList = isSharedMode && sharedTasks ? sharedTasks : tasks;

  return (
    <div className="desk-surface">
      <div className="desk-wrapper">
        <div className="paper-wrapper">
          <div className="paper-sheet">
            <div className="paper-content">
              {/* If viewing a shared calendar link */}
              {isSharedMode && (
                <div 
                  className="shared-banner"
                  style={{
                    backgroundColor: "#e0f2fe",
                    padding: "12px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                    borderBottom: "1px solid #bae6fd",
                    borderRadius: "8px",
                    marginBottom: "20px"
                  }}
                >
                  <span>
                    Viewing a shared calendar. Log in to import it into your own planner!
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {currentUser && (
                      <button onClick={handleImportShared} className="btn-link-action" style={{ fontWeight: "bold" }}>
                        Import Tasks
                      </button>
                    )}
                    <button onClick={handleCancelSharedView} className="btn-link-action" style={{ color: "#ef4444" }}>
                      Exit View
                    </button>
                  </div>
                </div>
              )}

              {!currentUser && !isSharedMode ? (
                /* Auth Screen Modal (Peach-cream modal card) */
                <AuthScreen onSuccess={handleAuthSuccess} />
              ) : (
                /* Main Calendar Page View */
                <>
                  {/* Calendar Top Navigation Header */}
                  <header className="calendar-header">
                    <div className="calendar-title-group">
                      <h1 className="calendar-month-year">{getHeaderMonthYear()}</h1>
                      <div className="calendar-nav-controls">
                        <button onClick={handlePrevWeek} className="btn-nav-arrow" title="Previous Week">
                          &lt;
                        </button>
                        <button onClick={handleTodayNav} className="btn-link-action" style={{ color: "#000" }}>
                          Today
                        </button>
                        <button onClick={handleNextWeek} className="btn-nav-arrow" title="Next Week">
                          &gt;
                        </button>
                      </div>
                    </div>

                    <div className="calendar-actions-row">
                      {currentUser && (
                        <button onClick={handleShareCalendar} className="btn-link-action">
                          Share calendar
                        </button>
                      )}
                      <button onClick={() => window.print()} className="btn-icon-pill" title="Save / Print Calendar">
                        <svg viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </header>

                  {/* 7-column calendar week notepad lines */}
                  <CalendarGrid
                    tasks={activeTaskList}
                    activeWeekMonday={activeWeekMonday}
                    onToggleComplete={handleToggleComplete}
                    onTaskClick={(t) => setActiveModalTask(t)}
                    onAddTask={handleAddTask}
                    draggedTaskId={draggedTaskId}
                    setDraggedTaskId={setDraggedTaskId}
                    onMoveTask={handleMoveTask}
                  />

                  {/* Someday task tray at the bottom */}
                  <SomedaySection
                    tasks={activeTaskList}
                    onToggleComplete={handleToggleComplete}
                    onTaskClick={(t) => setActiveModalTask(t)}
                    onAddTask={handleAddSomedayTask}
                    draggedTaskId={draggedTaskId}
                    setDraggedTaskId={setDraggedTaskId}
                    onMoveTask={handleMoveTask}
                  />

                  {/* Task Detail Modal Popover Card */}
                  {activeModalTask && (
                    <TaskModal
                      task={activeModalTask}
                      onClose={() => setActiveModalTask(null)}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                    />
                  )}

                  {/* Settings and Info Footer */}
                  <footer className="planner-footer font-typewriter">
                    <div style={{ display: "flex", gap: "20px" }}>
                      <button 
                        onClick={handleMusicToggle} 
                        style={{ background: "transparent", border: 0, cursor: "pointer", color: "#888" }}
                      >
                        {audioSettings.music ? "♪ Music ON" : "🎚 Music OFF"}
                      </button>
                      <button 
                        onClick={handleSoundToggle} 
                        style={{ background: "transparent", border: 0, cursor: "pointer", color: "#888" }}
                      >
                        ⌨ Sounds {audioSettings.sound ? "ON" : "OFF"}
                      </button>
                    </div>

                    <div>
                      {currentUser ? (
                        <div className="user-status-container">
                          <span>Logged in: {currentUser}</span>
                          <button onClick={handleLogout} className="logout-btn">
                            Log Out
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setIsSharedMode(false)} className="btn-link-action">
                          Log In to Create Account
                        </button>
                      )}
                    </div>
                  </footer>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Keepsake A4 Grid layout */}
      <div className="print-layout" style={{ display: "none" }}>
        <div className="print-keepsake-container">
          <div className="print-header">
            <h1 className="print-title font-header">Weekly Calendar</h1>
            <p className="print-date">{getHeaderMonthYear()}</p>
          </div>

          <div className="print-content">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(activeWeekMonday);
              d.setDate(activeWeekMonday.getDate() + i);
              const dateStr = d.toISOString().split("T")[0];
              const dayTasks = activeTaskList.filter((t) => t.date === dateStr);
              const label = `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
              const dayName = d.toLocaleString("default", { weekday: "short" });

              return (
                <div key={dateStr} className="print-day-col">
                  <div className="print-day-title">{label} ({dayName})</div>
                  <ul className="print-day-tasks">
                    {dayTasks.map((t) => (
                      <li key={t.id} className={`print-task-item ${t.completed ? "completed" : ""}`}>
                        {t.completed ? "[X] " : "[ ] "}
                        {t.title}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="print-footer">
            — Generated by The Day Out Planner
          </div>
        </div>
      </div>
    </div>
  );
}
