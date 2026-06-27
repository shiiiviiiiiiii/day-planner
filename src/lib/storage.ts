export interface Activity {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  hidden: boolean;
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "1", title: "Have breakfast together", completed: false, order: 0, hidden: false },
  { id: "2", title: "Visit the bookstore", completed: false, order: 1, hidden: false },
  { id: "3", title: "Drink coffee", completed: false, order: 2, hidden: false },
  { id: "4", title: "Take silly pictures", completed: false, order: 3, hidden: false },
  { id: "5", title: "Buy ice cream", completed: false, order: 4, hidden: false },
  { id: "6", title: "Watch the sunset", completed: false, order: 5, hidden: false },
  { id: "7", title: "End the day with dinner", completed: false, order: 6, hidden: false },
];

const ACTIVITIES_KEY = "day_out_activities";
const PHOTO_KEY = "day_out_photo";
const AUDIO_SETTINGS_KEY = "day_out_audio_settings";

export const plannerStorage = {
  getActivities: (): Activity[] => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      if (!stored) {
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
        return DEFAULT_ACTIVITIES;
      }
      const parsed = JSON.parse(stored) as Activity[];
      return parsed.sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error("Error reading activities", e);
      return DEFAULT_ACTIVITIES;
    }
  },

  saveActivities: (activities: Activity[]): void => {
    try {
      const sorted = [...activities].sort((a, b) => a.order - b.order);
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(sorted));
      window.dispatchEvent(new Event("planner-storage-update"));
    } catch (e) {
      console.error("Error saving activities", e);
    }
  },

  addActivity: (title: string): Activity => {
    const activities = plannerStorage.getActivities();
    const maxOrder = activities.reduce((max, act) => act.order > max ? act.order : max, -1);
    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      completed: false,
      order: maxOrder + 1,
      hidden: false,
    };
    plannerStorage.saveActivities([...activities, newActivity]);
    return newActivity;
  },

  updateActivity: (updated: Activity): void => {
    const activities = plannerStorage.getActivities();
    const index = activities.findIndex(a => a.id === updated.id);
    if (index !== -1) {
      activities[index] = updated;
      plannerStorage.saveActivities(activities);
    }
  },

  deleteActivity: (id: string): void => {
    const activities = plannerStorage.getActivities();
    const filtered = activities.filter(a => a.id !== id);
    const reindexed = filtered.map((act, idx) => ({ ...act, order: idx }));
    plannerStorage.saveActivities(reindexed);
  },

  getPhoto: (): string | null => {
    return localStorage.getItem(PHOTO_KEY);
  },

  savePhoto: (base64String: string | null): void => {
    if (base64String) {
      localStorage.setItem(PHOTO_KEY, base64String);
    } else {
      localStorage.removeItem(PHOTO_KEY);
    }
    window.dispatchEvent(new Event("planner-storage-update"));
  },

  getAudioSettings: (): { music: boolean; sound: boolean } => {
    const defaultSettings = { music: false, sound: false };
    try {
      const stored = localStorage.getItem(AUDIO_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveAudioSettings: (settings: { music: boolean; sound: boolean }): void => {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("planner-audio-settings-update"));
  }
};
