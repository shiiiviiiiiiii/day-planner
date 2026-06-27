import React, { useEffect, useState } from "react";
import { PaperPage } from "./components/PaperPage";
import { Header } from "./components/Header";
import { Checklist } from "./components/Checklist";
import { Footer } from "./components/Footer";
import { CompletionExperience } from "./components/CompletionExperience";
import { SurpriseEgg } from "./components/SurpriseEgg";
import { AdminPanel } from "./components/AdminPanel";
import { type Activity, plannerStorage } from "./lib/storage";
import { playTypewriterClick, playCarriageReturnBell, stopAmbientMusic } from "./lib/audio";
import { CONFIG } from "./config";

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [audioSettings, setAudioSettings] = useState({ music: false, sound: false });
  
  // View states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  
  // Auth form
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Easter egg
  const [, setClickCount] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setActivities(plannerStorage.getActivities());
    setPhotoBase64(plannerStorage.getPhoto());
    setAudioSettings(plannerStorage.getAudioSettings());
    setIsLoaded(true);

    // Keyboard shortcut: Ctrl + Shift + A to open admin dashboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };

    // Event listener for storage updates (so edits in admin sync instantly)
    const handleStorageUpdate = () => {
      setActivities(plannerStorage.getActivities());
      setPhotoBase64(plannerStorage.getPhoto());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("planner-storage-update", handleStorageUpdate);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("planner-storage-update", handleStorageUpdate);
      stopAmbientMusic();
    };
  }, []);

  const handleToggle = (id: string) => {
    const updatedActivities = activities.map((activity) => {
      if (activity.id === id) {
        const nextCompleted = !activity.completed;
        
        if (audioSettings.sound) {
          playTypewriterClick();
        }

        return { ...activity, completed: nextCompleted };
      }
      return activity;
    });

    plannerStorage.saveActivities(updatedActivities);
    setActivities(updatedActivities);

    const visible = updatedActivities.filter((a) => !a.hidden);
    const wasCompletedBefore = activities.filter((a) => !a.hidden).every((a) => a.completed);
    const isCompletedNow = visible.length > 0 && visible.every((a) => a.completed);

    if (isCompletedNow && !wasCompletedBefore && audioSettings.sound) {
      setTimeout(() => {
        playCarriageReturnBell();
      }, 350);
    }
  };

  const handleTitleClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowSurprise(true);
        return 0;
      }
      return next;
    });
  };

  const handleAudioChange = (newSettings: { music: boolean; sound: boolean }) => {
    plannerStorage.saveAudioSettings(newSettings);
    setAudioSettings(newSettings);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (passwordInput === CONFIG.ADMIN_PASSWORD) {
      setAdminAuthenticated(true);
      setPasswordInput("");
    } else {
      setLoginError("Incorrect password.");
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setLoginError("");
  };

  const handleBack = () => {
    setIsAdminOpen(false);
  };

  const visibleActivities = activities.filter((a) => !a.hidden);
  const isCompleted = visibleActivities.length > 0 && visibleActivities.every((a) => a.completed);

  if (!isLoaded) {
    return (
      <div className="desk-surface">
        <div className="desk-loading font-typewriter italic">
          Unfolding notebook...
        </div>
      </div>
    );
  }

  return (
    <div className="desk-surface">
      <div className="desk-wrapper">
        <PaperPage isCompleted={isCompleted}>
          {isAdminOpen ? (
            /* Admin Panel Dashboard View */
            adminAuthenticated ? (
              <AdminPanel onBack={handleBack} onLogout={handleLogout} />
            ) : (
              /* Typewriter Password Prompt */
              <div className="admin-login-prompt font-typewriter select-none">
                <h2 className="font-header login-title">Access Restriction</h2>
                <p className="login-note italic">
                  "This checklist is private. Please prove you are authorized to edit today's story."
                </p>

                <form onSubmit={handleLoginSubmit} className="login-form">
                  <div className="form-group">
                    <label className="input-label">Password Prompt:</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Type password..."
                      className="input-text"
                      autoFocus
                    />
                  </div>

                  {loginError && (
                    <p className="login-error font-semibold">
                      ⚠ {loginError}
                    </p>
                  )}

                  <div className="login-action-row">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="action-back-link"
                    >
                      ← Go Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Unseal Page
                    </button>
                  </div>
                </form>

                <div className="login-footer-info">
                  * Password configured in config.ts file.
                </div>
              </div>
            )
          ) : (
            /* Checklist & Planner View */
            <>
              {/* Decorative margin notes */}
              <div className="margin-note margin-note-top font-handwritten">
                ★ Today's Mission
              </div>
              <div className="margin-note margin-note-bottom font-handwritten">
                "Don't forget to laugh"
              </div>

              {/* Header */}
              <Header
                completedCount={visibleActivities.filter((a) => a.completed).length}
                totalCount={visibleActivities.length}
                isCompleted={isCompleted}
                onTitleClick={handleTitleClick}
              />

              {/* Checklist list */}
              <Checklist activities={activities} onToggle={handleToggle} />

              {/* Surprise Easter Egg */}
              <SurpriseEgg show={showSurprise} onClose={() => setShowSurprise(false)} />

              {/* Completed Memory Polaroid card & envelope */}
              <CompletionExperience
                activities={activities}
                photoBase64={photoBase64}
                show={isCompleted}
              />

              {/* Footer sound controllers & quotes */}
              <Footer
                musicEnabled={audioSettings.music}
                soundEnabled={audioSettings.sound}
                onAudioChange={handleAudioChange}
                onAdminClick={() => setIsAdminOpen(true)}
              />
            </>
          )}
        </PaperPage>
      </div>
    </div>
  );
}

export default App;
