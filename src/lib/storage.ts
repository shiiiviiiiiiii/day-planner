export interface Activity {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  hidden: boolean;
}

export interface UserAccount {
  username: string;
  passwordHash: string; // Kept as simple hashing or string for local testing
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

const USERS_KEY = "planner_users_accounts";
const SESSION_KEY = "planner_current_user_session";
const AUDIO_SETTINGS_KEY = "day_out_audio_settings";

export const plannerStorage = {
  // --- USER AUTHENTICATION ---
  
  getCurrentUser: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SESSION_KEY);
  },

  setCurrentUser: (username: string | null): void => {
    if (typeof window === "undefined") return;
    if (username) {
      localStorage.setItem(SESSION_KEY, username.toLowerCase().trim());
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new Event("planner-storage-update"));
  },

  getUsers: (): UserAccount[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  signup: (username: string, password: string): { success: boolean; error?: string } => {
    const name = username.toLowerCase().trim();
    if (!name || password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    const users = plannerStorage.getUsers();
    if (users.some(u => u.username === name)) {
      return { success: false, error: "Username is already taken." };
    }

    const newUser: UserAccount = {
      username: name,
      passwordHash: btoa(password), // Simple base64 encoding as a mock hash for local storage
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    
    // Seed default tasks for this new user
    const userActivitiesKey = `day_out_activities_${name}`;
    localStorage.setItem(userActivitiesKey, JSON.stringify(DEFAULT_ACTIVITIES));
    
    // Log the user in
    plannerStorage.setCurrentUser(name);
    return { success: true };
  },

  login: (username: string, password: string): { success: boolean; error?: string } => {
    const name = username.toLowerCase().trim();
    const users = plannerStorage.getUsers();
    const user = users.find(u => u.username === name);

    if (!user || user.passwordHash !== btoa(password)) {
      return { success: false, error: "Invalid username or password." };
    }

    plannerStorage.setCurrentUser(name);
    return { success: true };
  },

  logout: (): void => {
    plannerStorage.setCurrentUser(null);
  },

  // --- SCOPED CONTENT (Scoped per current active user) ---

  getActivities: (): Activity[] => {
    const user = plannerStorage.getCurrentUser();
    if (!user) return [];
    
    const activitiesKey = `day_out_activities_${user}`;
    try {
      const stored = localStorage.getItem(activitiesKey);
      if (!stored) {
        localStorage.setItem(activitiesKey, JSON.stringify(DEFAULT_ACTIVITIES));
        return DEFAULT_ACTIVITIES;
      }
      const parsed = JSON.parse(stored) as Activity[];
      return parsed.sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error("Error reading activities for " + user, e);
      return DEFAULT_ACTIVITIES;
    }
  },

  saveActivities: (activities: Activity[]): void => {
    const user = plannerStorage.getCurrentUser();
    if (!user) return;

    const activitiesKey = `day_out_activities_${user}`;
    try {
      const sorted = [...activities].sort((a, b) => a.order - b.order);
      localStorage.setItem(activitiesKey, JSON.stringify(sorted));
      window.dispatchEvent(new Event("planner-storage-update"));
    } catch (e) {
      console.error("Error saving activities for " + user, e);
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
    const user = plannerStorage.getCurrentUser();
    if (!user) return null;
    return localStorage.getItem(`day_out_photo_${user}`);
  },

  savePhoto: (base64String: string | null): void => {
    const user = plannerStorage.getCurrentUser();
    if (!user) return;

    const photoKey = `day_out_photo_${user}`;
    if (base64String) {
      localStorage.setItem(photoKey, base64String);
    } else {
      localStorage.removeItem(photoKey);
    }
    window.dispatchEvent(new Event("planner-storage-update"));
  },

  // --- SETTINGS (Shared or scoped) ---

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
