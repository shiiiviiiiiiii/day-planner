import React, { useEffect, useState } from "react";

interface HeaderProps {
  completedCount: number;
  totalCount: number;
  isCompleted: boolean;
  onTitleClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  completedCount,
  totalCount,
  isCompleted,
  onTitleClick,
}) => {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setFormattedDate(new Date().toLocaleDateString("en-US", options));
  }, []);

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <header className="planner-header select-none">
      {/* Top row: Date and Counter */}
      <div className="header-meta-row font-typewriter">
        <div className="current-date">{formattedDate || "Today's Date"}</div>
        <div className="progress-fraction">
          {completedCount} / {totalCount} Completed
        </div>
      </div>

      {/* Main Title section */}
      <div className="title-section text-center">
        <h1 
          onClick={onTitleClick}
          className="main-title font-header cursor-pointer select-none"
        >
          The Day Out
          <span 
            className={`cursor-indicator ${isCompleted ? "cursor-indicator-stop" : "cursor-indicator-blink"}`} 
          />
        </h1>
        <p className="subtitle italic font-typewriter">
          Let's complete everything before the day ends.
        </p>
      </div>

      {/* Hand-drawn progress bar */}
      <div className="pencil-progress-container">
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="pencil-progress-svg">
          {/* Sketchy background track */}
          <path
            d="M 1 4 Q 25 2.8, 50 4.8 T 99 4"
            fill="none"
            stroke="#d4c8b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 1.5 3.8 Q 30 4.2, 60 3.2 T 98.5 4.2"
            fill="none"
            stroke="#d4c8b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="4 2"
          />
          {/* Sketchy completed fill */}
          {progressPercent > 0 && (
            <path
              d="M 1 4 Q 25 2.8, 50 4.8 T 99 4"
              fill="none"
              stroke="#4e342e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - progressPercent}
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          )}
        </svg>
      </div>
    </header>
  );
};
