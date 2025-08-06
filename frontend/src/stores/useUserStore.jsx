import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  users: [],
  sessions: [],
  SID: 0, // default session ID

  setSID: (sid) => set({ SID: sid }),

  fetchUsers: async () => {
    try {
      const sid = get().SID;
      const res = await fetch(`http://localhost:3000/data?sid=${sid}`);
      const data = await res.json();
      set({ users: data });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  },

  fetchSessions: async () => {
    try {
      const res = await fetch('http://localhost:3000/sessions');
      const data = await res.json(); // expects [{ sid: 1 }, { sid: 2 }, ...]
      set({ sessions: data });
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  },

  addUser: (userId) => set((state) => {
    const exists = state.users.some(u => u.userId === userId);
    if (exists) return state;
    return {
      users: [...state.users, { userId, gps: [], u2b: [], b2u: [] }]
    };
  }),

  updateGps: (userId, gps) =>
    set((state) => ({
      users: state.users.map(user =>
        user.userId === userId ? { ...user, gps: [...user.gps, ...gps] } : user
      )
    })),

  updateU2B: (userId, u2b) =>
    set((state) => ({
      users: state.users.map(user =>
        user.userId === userId ? { ...user, u2b: [...user.u2b, ...u2b] } : user
      )
    })),

  updateB2U: (userId, b2u) =>
    set((state) => ({
      users: state.users.map(user =>
        user.userId === userId ? { ...user, b2u: [...user.b2u, ...b2u] } : user
      )
    })),

  setUsers: (updater) =>
    set((state) => {
      const newUsers = typeof updater === 'function' ? updater(state.users) : updater;
      return { users: newUsers };
    }),
    addSession: async () => {
  try {
    const res = await fetch('http://localhost:3000/sessions', {
      method: 'POST',
    });
    const data = await res.json();

    if (data.sid) {
      set({ SID: data.sid });            // set new session as current
      await get().fetchSessions();       // refresh session list
    }
  } catch (err) {
    console.error('❌ Failed to add session:', err);
  }
}

}));

export default useUserStore;
