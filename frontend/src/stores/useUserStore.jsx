import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  users: [],
  sessions: [],
  SID: 0, // default session ID

  // 🔹 Set current session ID
  setSID: (sid) => set({ SID: sid }),

  // 🔹 Fetch users from DB for the current session
  fetchUsers: async () => {
    try {
      const sid = get().SID;
      console.log("Fetching users for SID:", sid);

      const res = await fetch(`http://localhost:3001/data?sid=${sid}`);
      const data = await res.json();

      console.log("DB data fetched:", data);
      set({ users: data }); // always replace with DB data
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  },

  // 🔹 Fetch all sessions from DB
  fetchSessions: async () => {
    try {
      const res = await fetch('http://localhost:3001/sessions');
      const data = await res.json();
      set({ sessions: data });
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  },

  // 🔹 Add a new session
  addSession: async () => {
    try {
      const res = await fetch('http://localhost:3001/sessions', { method: 'POST' });
      const data = await res.json();

      if (data.sid) {
        set({ SID: data.sid });            // set new session as current
        await get().fetchSessions();       // refresh session list
      }
    } catch (err) {
      console.error('❌ Failed to add session:', err);
    }
  },

  // 🔹 End a session (mark as 'finish')
  endSession: async (sid) => {
    try {
      const res = await fetch(`http://localhost:3001/sessions/${sid}/end`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchSessions(); // refresh session list to reflect new status
      }
      return data;
    } catch (err) {
      console.error('❌ Failed to end session:', err);
      return { error: err.message };
    }
  },

  // 🔹 End current session and immediately start a new one
  endAndStartNew: async (sid) => {
    try {
      // End the current session
      await fetch(`http://localhost:3001/sessions/${sid}/end`, { method: 'PATCH' });

      // Create a new session
      const res = await fetch('http://localhost:3001/sessions', { method: 'POST' });
      const data = await res.json();

      if (data.sid) {
        set({ SID: data.sid });
        await get().fetchSessions();
        return { newSid: data.sid };
      }
    } catch (err) {
      console.error('❌ Failed to end and start session:', err);
      return { error: err.message };
    }
  },

  // 🔹 Add a new user locally (optional, not affecting DB)
  addUser: (userId) =>
    set((state) => {
      const exists = state.users.some((u) => u.userId === userId);
      if (exists) return state;
      return { users: [...state.users, { userId, gps: [], u2b: [], b2u: [] }] };
    }),

  // 🔹 Update user GPS
  updateGps: (userId, gps) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.userId === userId ? { ...user, gps: [...user.gps, ...gps] } : user
      ),
    })),

  // 🔹 Update user messages
  updateU2B: (userId, u2b) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.userId === userId ? { ...user, u2b: [...user.u2b, ...u2b] } : user
      ),
    })),
  updateB2U: (userId, b2u) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.userId === userId ? { ...user, b2u: [...user.b2u, ...b2u] } : user
      ),
    })),

  // 🔹 Directly set users array
  setUsers: (updater) =>
    set((state) => {
      const newUsers = typeof updater === 'function' ? updater(state.users) : updater;
      return { users: newUsers };
    }),

  // 🔹 Removed local updateUserName to always rely on DB usernames
}));

export default useUserStore;
