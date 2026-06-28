import { useEffect, useState } from "react";
import { PaperPage } from "./components/PaperPage";
import { Header } from "./components/Header";
import { Checklist } from "./components/Checklist";
import { Footer } from "./components/Footer";
import { CompletionExperience } from "./components/CompletionExperience";
import { SurpriseEgg } from "./components/SurpriseEgg";
import { AdminPanel } from "./components/AdminPanel";
import { AuthScreen } from "./components/AuthScreen";
import { type Activity, plannerStorage } from "./lib/storage";
import { playTypewriterClick, playCarriageReturnBell, stopAmbientMusic } from "./lib/audio";

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [audioSettings, setAudioSettings] = useState({ music: false, sound: false });
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Edit mode toggle (replaces hidden Admin screen)
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);

  // Easter egg
  const [, setClickCount] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const user = plannerStorage.getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      setActivities(plannerStorage.getActivities());
      setPhotoBase64(plannerStorage.getPhoto());
    }
    setAudioSettings(plannerStorage.getAudioSettings());
    setIsLoaded(true);

    // Keyboard shortcut: Ctrl + Shift + A to toggle organize mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        if (plannerStorage.getCurrentUser()) {
          setIsOrganizeOpen((prev) => !prev);
        }
      }
    };

    // Event listener for storage updates (so edits in organize panel sync instantly)
    const handleStorageUpdate = () => {
      setCurrentUser(plannerStorage.getCurrentUser());
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

  const handleAuthSuccess = () => {
    const user = plannerStorage.getCurrentUser();
    setCurrentUser(user);
    setActivities(plannerStorage.getActivities());
    setPhotoBase64(plannerStorage.getPhoto());
  };

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
    if (!currentUser) return;
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

  const handleLogout = () => {
    plannerStorage.logout();
    setCurrentUser(null);
    setActivities([]);
    setPhotoBase64(null);
    setIsOrganizeOpen(false);
  };

  const visibleActivities = activities.filter((a) => !a.hidden);
  const isCompleted = currentUser !== null && visibleActivities.length > 0 && visibleActivities.every((a) => a.completed);

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
          {!currentUser ? (
            /* Logged Out: Authentication screen */
            <>
              <AuthScreen onSuccess={handleAuthSuccess} />
              
              {/* Basic footer for logged out state */}
              <Footer
                musicEnabled={audioSettings.music}
                soundEnabled={audioSettings.sound}
                onAudioChange={handleAudioChange}
                onAdminClick={() => {}} // Disabled when logged out
              />
            </>
          ) : isOrganizeOpen ? (
            /* Logged In: Edit/Organize Checklist View */
            <AdminPanel 
              onBack={() => setIsOrganizeOpen(false)} 
              onLogout={handleLogout} 
            />
          ) : (
            /* Logged In: Main Checklist & View Mode */
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

              {/* Footer sound controllers, quotes, and edit toggles */}
              <Footer
                musicEnabled={audioSettings.music}
                soundEnabled={audioSettings.sound}
                onAudioChange={handleAudioChange}
                onAdminClick={() => setIsOrganizeOpen(true)}
              />
            </>
          )}
        </PaperPage>
      </div>
    </div>
  );
}

export default App;
