import { useEffect, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { CalendarGrid } from "./components/CalendarGrid";
import { SomedaySection } from "./components/SomedaySection";
import { TaskModal } from "./components/TaskModal";
import { DumpListDrawer } from "./components/DumpListDrawer";
import { type CalendarTask, plannerStorage } from "./lib/storage";
import { playTypewriterClick, playCarriageReturnBell, playAmbientMusic, stopAmbientMusic } from "./lib/audio";

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const parseColorTag = (text: string): { cleanedTitle: string; color: string } => {
  const match = text.match(/#(yellow|green|blue|pink|none)\b/i);
  if (match) {
    const color = match[1].toLowerCase();
    const cleanedTitle = text.replace(match[0], "").replace(/\s+/g, " ").trim();
    return { cleanedTitle, color };
  }
  return { cleanedTitle: text, color: "none" };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [activeWeekMonday, setActiveWeekMonday] = useState<Date>(getMonday(new Date()));
  const [audioSettings, setAudioSettings] = useState({ music: false, sound: false, textWrapping: false });

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modal active task
  const [activeModalTask, setActiveModalTask] = useState<CalendarTask | null>(null);

  // Shared Calendar state
  const [sharedTasks, setSharedTasks] = useState<CalendarTask[] | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  // Layout states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isDumpListOpen, setIsDumpListOpen] = useState(false);
  const [dayPhotos, setDayPhotos] = useState<{ [dateStr: string]: string }>({});

  const [isLoaded, setIsLoaded] = useState(false);
  const [weekShiftTimer, setWeekShiftTimer] = useState<any>(null);

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
      loadPhotosForWeek(activeWeekMonday);
    }

    const settings = plannerStorage.getAudioSettings();
    setAudioSettings({
      music: settings.music,
      sound: settings.sound,
      textWrapping: settings.textWrapping || false,
    });
    setIsLoaded(true);

    const handleStorageUpdate = () => {
      setCurrentUser(plannerStorage.getCurrentUser());
    };

    window.addEventListener("planner-storage-update", handleStorageUpdate);
    return () => {
      window.removeEventListener("planner-storage-update", handleStorageUpdate);
      stopAmbientMusic();
    };
  }, []);

  // Reload photos when active week or user changes
  useEffect(() => {
    if (currentUser) {
      loadPhotosForWeek(activeWeekMonday);
    }
  }, [activeWeekMonday, currentUser]);

  const loadPhotosForWeek = (monday: Date) => {
    const photos: { [dateStr: string]: string } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const photo = plannerStorage.getDayPhoto(dateStr);
      if (photo) {
        photos[dateStr] = photo;
      }
    }
    setDayPhotos(photos);
  };

  // Handle successful login/signup
  const handleAuthSuccess = () => {
    const user = plannerStorage.getCurrentUser();
    setCurrentUser(user);
    setTasks(plannerStorage.getTasks());
    loadPhotosForWeek(activeWeekMonday);
  };

  const handleLogout = () => {
    plannerStorage.logout();
    setCurrentUser(null);
    setTasks([]);
    setDayPhotos({});
    setActiveModalTask(null);
    setIsDumpListOpen(false);
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

  // Drag over Arrow week navigation shifts
  const handleDragOverWeekShift = (direction: "prev" | "next") => {
    if (weekShiftTimer) return;
    const timer = setTimeout(() => {
      if (direction === "prev") {
        handlePrevWeek();
      } else {
        handleNextWeek();
      }
      setWeekShiftTimer(null);
    }, 700);
    setWeekShiftTimer(timer);
  };

  const handleDragLeaveWeekShift = () => {
    if (weekShiftTimer) {
      clearTimeout(weekShiftTimer);
      setWeekShiftTimer(null);
    }
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
    const { cleanedTitle, color } = parseColorTag(title);
    const newTask: CalendarTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: cleanedTitle,
      completed: false,
      date: dateStr,
      color: color,
      notes: "",
      subtasks: []
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    plannerStorage.saveTasks(updated);
  };

  const handleAddSomedayTask = (title: string) => {
    if (isSharedMode) return;
    const { cleanedTitle, color } = parseColorTag(title);
    const newTask: CalendarTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: cleanedTitle,
      completed: false,
      date: "someday",
      color: color,
      notes: "",
      subtasks: []
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    plannerStorage.saveTasks(updated);
  };

  const handleAddDumpTask = (title: string) => {
    if (isSharedMode) return;
    const { cleanedTitle, color } = parseColorTag(title);
    const newTask: CalendarTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: cleanedTitle,
      completed: false,
      date: "dump",
      color: color,
      notes: "",
      subtasks: []
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    plannerStorage.saveTasks(updated);
  };

  const handleUpdateTask = (updatedTask: CalendarTask) => {
    const { cleanedTitle, color } = parseColorTag(updatedTask.title);
    
    // Maintain old color tag if none was typed inside title
    const finalColor = color !== "none" ? color : (updatedTask.color || "none");

    const finalizedTask = {
      ...updatedTask,
      title: cleanedTitle,
      color: finalColor,
    };

    const currentList = isSharedMode && sharedTasks ? sharedTasks : tasks;
    const updated = currentList.map((t) => (t.id === updatedTask.id ? finalizedTask : t));

    if (isSharedMode) {
      setSharedTasks(updated);
    } else {
      setTasks(updated);
      plannerStorage.saveTasks(updated);
    }

    // Keep active modal in sync
    if (activeModalTask && activeModalTask.id === updatedTask.id) {
      setActiveModalTask(finalizedTask);
    }
  };

  const handleDeleteTask = (id: string) => {
    const currentList = isSharedMode && sharedTasks ? sharedTasks : tasks;
    const updated = currentList.filter((t) => t.id !== id);

    if (isSharedMode) {
      setSharedTasks(updated);
    } else {
      setTasks(updated);
      plannerStorage.saveTasks(updated);
    }
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

  // Polaroid Daily Photos Handlers
  const handleUploadPhoto = (dateStr: string, base64: string) => {
    plannerStorage.saveDayPhoto(dateStr, base64);
    setDayPhotos((prev) => ({ ...prev, [dateStr]: base64 }));
  };

  const handleDeletePhoto = (dateStr: string) => {
    plannerStorage.saveDayPhoto(dateStr, null);
    setDayPhotos((prev) => {
      const updated = { ...prev };
      delete updated[dateStr];
      return updated;
    });
  };

  // Import shared calendar tasks
  const handleImportShared = () => {
    if (!sharedTasks) return;
    const merged = [...tasks];
    sharedTasks.forEach((sTask) => {
      if (!merged.some((m) => m.title === sTask.title && m.date === sTask.date)) {
        merged.push({
          ...sTask,
          id: Math.random().toString(36).substring(2, 9),
        });
      }
    });
    setTasks(merged);
    plannerStorage.saveTasks(merged);
    setIsSharedMode(false);
    setSharedTasks(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    alert("Shared calendar tasks have been imported into your notebook!");
  };

  const handleCancelSharedView = () => {
    setIsSharedMode(false);
    setSharedTasks(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Generate Base64 Share Link
  const handleShareCalendar = () => {
    const weekDaysStrs: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(activeWeekMonday);
      d.setDate(activeWeekMonday.getDate() + i);
      weekDaysStrs.push(d.toISOString().split("T")[0]);
    }

    const tasksToShare = tasks.filter(
      (t) => weekDaysStrs.includes(t.date) || t.date === "someday"
    );

    const json = JSON.stringify(tasksToShare);
    const base64 = btoa(unescape(encodeURIComponent(json)));
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
    const updated = { music: nextMusic, sound: audioSettings.sound, textWrapping: audioSettings.textWrapping };
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
    const updated = { music: audioSettings.music, sound: nextSound, textWrapping: audioSettings.textWrapping };
    plannerStorage.saveAudioSettings(updated);
    setAudioSettings(updated);
  };

  const handleTextWrappingToggle = () => {
    const nextWrapping = !audioSettings.textWrapping;
    const updated = { music: audioSettings.music, sound: audioSettings.sound, textWrapping: nextWrapping };
    plannerStorage.saveAudioSettings(updated);
    setAudioSettings(updated);
  };

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
                    <h1 className="calendar-month-year">{getHeaderMonthYear()}</h1>

                    <div className="calendar-header-right">
                      {/* Dump List Drawer Toggle Button (Slightly orange list button) */}
                      {currentUser && (
                        <button
                          onClick={() => setIsDumpListOpen(!isDumpListOpen)}
                          className="btn-header-circle btn-more"
                          style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                          title="Open Dump List Drawer"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                        </button>
                      )}

                      {/* Profile Button (Blue Circle) */}
                      {currentUser && (
                        <button
                          onClick={() => alert(`Logged in as: ${currentUser}`)}
                          className="btn-header-circle btn-profile"
                          title={`Profile: ${currentUser}`}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </button>
                      )}

                      {/* Settings Menu Button (Purple Circle) */}
                      <div className="header-menu-container">
                        <button
                          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                          className="btn-header-circle btn-more"
                          title="Menu Options"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        
                        {showSettingsMenu && (
                          <div className="header-dropdown-menu">
                            {currentUser && (
                              <button onClick={() => { setShowSettingsMenu(false); handleShareCalendar(); }} className="dropdown-item">
                                Share Calendar
                              </button>
                            )}
                            <button onClick={() => { setShowSettingsMenu(false); window.print(); }} className="dropdown-item">
                              Save/Print Calendar
                            </button>
                            <button onClick={() => { setShowSettingsMenu(false); handleMusicToggle(); }} className="dropdown-item">
                              {audioSettings.music ? "♪ Music: ON" : "🎚 Music: OFF"}
                            </button>
                            <button onClick={() => { setShowSettingsMenu(false); handleSoundToggle(); }} className="dropdown-item">
                              ⌨ Sounds: {audioSettings.sound ? "ON" : "OFF"}
                            </button>
                            <button onClick={() => { setShowSettingsMenu(false); handleTextWrappingToggle(); }} className="dropdown-item">
                              Wrap Text: {audioSettings.textWrapping ? "ON" : "OFF"}
                            </button>
                            <button onClick={() => { setShowSettingsMenu(false); handleTodayNav(); }} className="dropdown-item">
                              Go to Today
                            </button>
                            <div className="dropdown-divider" />
                            <button onClick={() => { setShowSettingsMenu(false); handleLogout(); }} className="dropdown-item text-danger">
                              Log Out
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Navigation Arrow buttons supporting drag week shifts */}
                      <button 
                        onClick={handlePrevWeek} 
                        onDragOver={(e) => { e.preventDefault(); handleDragOverWeekShift("prev"); }}
                        onDragLeave={handleDragLeaveWeekShift}
                        className="btn-header-circle btn-nav-arrow-left" 
                        title="Previous Week"
                      >
                        &lt;
                      </button>
                      <button 
                        onClick={handleNextWeek} 
                        onDragOver={(e) => { e.preventDefault(); handleDragOverWeekShift("next"); }}
                        onDragLeave={handleDragLeaveWeekShift}
                        className="btn-header-circle btn-nav-arrow-right" 
                        title="Next Week"
                      >
                        &gt;
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
                    dayPhotos={dayPhotos}
                    onUploadPhoto={handleUploadPhoto}
                    onDeletePhoto={handleDeletePhoto}
                    textWrappingEnabled={audioSettings.textWrapping}
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

                  {/* Dump List Drawer (Jot ideas and drag onto calendar) */}
                  <DumpListDrawer
                    isOpen={isDumpListOpen}
                    onClose={() => setIsDumpListOpen(false)}
                    tasks={activeTaskList}
                    onToggleComplete={handleToggleComplete}
                    onTaskClick={(t) => setActiveModalTask(t)}
                    onAddTask={handleAddDumpTask}
                    setDraggedTaskId={setDraggedTaskId}
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

                  {/* Minimal Info Footer */}
                  <footer className="planner-footer font-typewriter">
                    <div>
                      <span>Logged in: {currentUser}</span>
                    </div>
                    <div>
                      <span>— The Day Out Planner</span>
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
