export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CalendarTask {
  id: string;
  title: string;
  completed: boolean;
  date: string; // Format: "YYYY-MM-DD" or "someday"
  color?: string; // "yellow" | "green" | "blue" | "pink" | "none"
  notes?: string;
  subtasks?: Subtask[];
}

export interface UserAccount {
  email: string;
  passwordHash: string;
}

const USERS_KEY = "planner_users_accounts";
const SESSION_KEY = "planner_current_user_session";
const AUDIO_SETTINGS_KEY = "day_out_audio_settings";

const getSeedTasksForCurrentWeek = (): CalendarTask[] => {
  const today = new Date();
  const day = today.getDay();
  // Calculate Monday of this week
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  const formatDate = (offsetDays: number) => {
    const target = new Date(monday);
    target.setDate(monday.getDate() + offsetDays);
    return target.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  return [
    { 
      id: "s1", 
      title: "Hover to complete", 
      completed: false, 
      date: formatDate(0), // Monday
      color: "none", 
      notes: "Hover over the checkmark on the right of a task to complete it!", 
      subtasks: [] 
    },
    { 
      id: "s2", 
      title: "Click to edit", 
      completed: false, 
      date: formatDate(0), // Monday
      color: "none", 
      notes: "Clicking a task opens a popup window where you can add subtasks and detailed descriptions.", 
      subtasks: [] 
    },
    { 
      id: "s3", 
      title: "Drag to other day", 
      completed: false, 
      date: formatDate(0), // Monday
      color: "none", 
      notes: "You can drag and drop items between days or down to Someday.", 
      subtasks: [] 
    },
    { 
      id: "s4", 
      title: "Choose from colors", 
      completed: false, 
      date: formatDate(1), // Tuesday
      color: "yellow", 
      notes: "You can tag tasks with soft highlight colors to organize them visually.", 
      subtasks: [] 
    },
    { 
      id: "s5", 
      title: "Hope you like 😆", 
      completed: false, 
      date: formatDate(1), // Tuesday
      color: "none", 
      notes: "A clean weekly dashboard designed for sharing.", 
      subtasks: [] 
    },
    { 
      id: "s6", 
      title: "That's all!", 
      completed: false, 
      date: formatDate(2), // Wednesday
      color: "green", 
      notes: "All set!", 
      subtasks: [] 
    },
    { 
      id: "s7", 
      title: "Remember to save 👆", 
      completed: false, 
      date: formatDate(4), // Friday
      color: "none", 
      notes: "Click Save Calendar or print to PDF.", 
      subtasks: [] 
    },
    { 
      id: "s8", 
      title: "Plan next adventure", 
      completed: false, 
      date: "someday", 
      color: "none", 
      notes: "Ideas for the future...", 
      subtasks: [
        { id: "sub1", title: "Invite friends", completed: false },
        { id: "sub2", title: "Choose location", completed: false }
      ] 
    },
  ];
};

export const plannerStorage = {
  // --- USER AUTHENTICATION ---
  
  getCurrentUser: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SESSION_KEY);
  },

  setCurrentUser: (email: string | null): void => {
    if (typeof window === "undefined") return;
    if (email) {
      localStorage.setItem(SESSION_KEY, email.toLowerCase().trim());
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

  signup: (email: string, password: string): { success: boolean; error?: string } => {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail || !formattedEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    const users = plannerStorage.getUsers();
    if (users.some(u => u.email === formattedEmail)) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser: UserAccount = {
      email: formattedEmail,
      passwordHash: btoa(password),
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    
    // Seed default tasks for this new user
    const userTasksKey = `day_out_tasks_${formattedEmail}`;
    localStorage.setItem(userTasksKey, JSON.stringify(getSeedTasksForCurrentWeek()));
    
    // Log in
    plannerStorage.setCurrentUser(formattedEmail);
    return { success: true };
  },

  login: (email: string, password: string): { success: boolean; error?: string } => {
    const formattedEmail = email.toLowerCase().trim();
    const users = plannerStorage.getUsers();
    const user = users.find(u => u.email === formattedEmail);

    if (!user || user.passwordHash !== btoa(password)) {
      return { success: false, error: "Invalid email or password." };
    }

    plannerStorage.setCurrentUser(formattedEmail);
    return { success: true };
  },

  logout: (): void => {
    plannerStorage.setCurrentUser(null);
  },

  // --- CALENDAR TASKS SCOPED PER LOGGED-IN EMAIL ---

  getTasks: (): CalendarTask[] => {
    const email = plannerStorage.getCurrentUser();
    if (!email) return [];
    
    const tasksKey = `day_out_tasks_${email}`;
    try {
      const stored = localStorage.getItem(tasksKey);
      if (!stored) {
        const seed = getSeedTasksForCurrentWeek();
        localStorage.setItem(tasksKey, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(stored) as CalendarTask[];
    } catch (e) {
      console.error("Error reading tasks for " + email, e);
      return [];
    }
  },

  saveTasks: (tasks: CalendarTask[]): void => {
    const email = plannerStorage.getCurrentUser();
    if (!email) return;

    const tasksKey = `day_out_tasks_${email}`;
    try {
      localStorage.setItem(tasksKey, JSON.stringify(tasks));
      window.dispatchEvent(new Event("planner-storage-update"));
    } catch (e) {
      console.error("Error saving tasks for " + email, e);
    }
  },

  addTask: (title: string, date: string): CalendarTask => {
    const tasks = plannerStorage.getTasks();
    const newTask: CalendarTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      completed: false,
      date: date,
      color: "none",
      notes: "",
      subtasks: []
    };
    plannerStorage.saveTasks([...tasks, newTask]);
    return newTask;
  },

  updateTask: (updated: CalendarTask): void => {
    const tasks = plannerStorage.getTasks();
    const index = tasks.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      tasks[index] = updated;
      plannerStorage.saveTasks(tasks);
    }
  },

  deleteTask: (id: string): void => {
    const tasks = plannerStorage.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    plannerStorage.saveTasks(filtered);
  },

  // --- SETTINGS ---

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
