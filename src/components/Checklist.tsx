import React from "react";
import { type Activity } from "../lib/storage";

interface ChecklistProps {
  activities: Activity[];
  onToggle: (id: string) => void;
}

export const Checklist: React.FC<ChecklistProps> = ({ activities, onToggle }) => {
  const visibleActivities = activities.filter((a) => !a.hidden);

  if (visibleActivities.length === 0) {
    return (
      <div className="empty-checklist font-typewriter italic">
        No activities planned for today. Add some in the Admin panel (Ctrl+Shift+A).
      </div>
    );
  }

  return (
    <div className="checklist-container select-none">
      {visibleActivities.map((activity) => (
        <div
          key={activity.id}
          onClick={() => onToggle(activity.id)}
          className={`checklist-item group ${activity.completed ? "completed" : ""}`}
        >
          {/* Custom Checkbox */}
          <div
            className={`checklist-checkbox ${activity.completed ? "checked" : ""}`}
          >
            {activity.completed && (
              <span className="font-header checkbox-x">
                X
              </span>
            )}
          </div>

          {/* Title and Strike line */}
          <span className="checklist-title font-typewriter">
            {activity.title}
            <span className={`strike-line ${activity.completed ? "active" : ""}`} />
          </span>
        </div>
      ))}
    </div>
  );
};
