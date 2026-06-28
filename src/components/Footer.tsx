import React, { useEffect, useState } from "react";
import { playAmbientMusic, stopAmbientMusic } from "../lib/audio";
import { plannerStorage } from "../lib/storage";

const QUOTES = [
  "Life happens in ordinary moments.",
  "Collect memories, not things.",
  "Today's stories become tomorrow's nostalgia.",
  "Time spent together is never wasted.",
  "We do not remember days, we remember moments.",
  "Enjoy the little things in life.",
  "The best part of today was spending it with you."
];

interface FooterProps {
  musicEnabled: boolean;
  soundEnabled: boolean;
  onAudioChange: (settings: { music: boolean; sound: boolean }) => void;
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  musicEnabled,
  soundEnabled,
  onAudioChange,
  onAdminClick,
}) => {
  const [selectedQuote, setSelectedQuote] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setSelectedQuote(QUOTES[randomIndex]);
    setCurrentUser(plannerStorage.getCurrentUser());

    const handleStorageUpdate = () => {
      setCurrentUser(plannerStorage.getCurrentUser());
    };
    window.addEventListener("planner-storage-update", handleStorageUpdate);
    return () => {
      window.removeEventListener("planner-storage-update", handleStorageUpdate);
    };
  }, []);

  const handleMusicToggle = () => {
    const nextMusic = !musicEnabled;
    onAudioChange({ music: nextMusic, sound: soundEnabled });
    if (nextMusic) {
      playAmbientMusic();
    } else {
      stopAmbientMusic();
    }
  };

  const handleSoundToggle = () => {
    onAudioChange({ music: musicEnabled, sound: !soundEnabled });
  };

  return (
    <footer className="planner-footer font-typewriter">
      {/* Audio controls */}
      <div className="audio-controls-row">
        <button
          onClick={handleMusicToggle}
          className={`audio-btn ${musicEnabled ? "active" : ""}`}
        >
          <span>{musicEnabled ? "♪" : "🎚"} Play Ambient Music</span>
          <span className="audio-toggle-state">
            {musicEnabled ? "ON" : "OFF"}
          </span>
        </button>

        <button
          onClick={handleSoundToggle}
          className={`audio-btn ${soundEnabled ? "active" : ""}`}
        >
          <span>⌨ Sound Effects</span>
          <span className="audio-toggle-state">
            {soundEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {/* Random Quote */}
      <div className="random-quote-container italic">
        "{selectedQuote}"
      </div>

      {/* User Context & Action Button */}
      <div className="footer-journal-credit">
        {currentUser ? (
          <div className="user-status-container">
            <span className="user-badge">[{currentUser}]</span>
            <button
              onClick={onAdminClick}
              className="organize-toggle-btn"
              title="Organize Tasks"
            >
              ⚙ Organize
            </button>
          </div>
        ) : (
          <span>— The Day Out</span>
        )}
      </div>
    </footer>
  );
};
