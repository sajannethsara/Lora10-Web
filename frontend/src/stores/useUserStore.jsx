import { create } from 'zustand'

const useUserStore = create((set) => ({
 users : [
  {
    userId: 'user1',
    gps: [
      { lat: 6.9271, lng: 79.8612, timestamp: 1718000000000 }, // Colombo
      { lat: 7.2906, lng: 80.6337, timestamp: 1718000005000 }, // Kandy
      { lat: 6.0535, lng: 80.2210, timestamp: 1718000010000 }  // Galle
    ],
    u2b: [
      { text: 'Hello base! Heading to Kandy.', timestamp: 1718000001000 }
    ],
    b2u: [
      { text: 'Roger that! Stay safe.', timestamp: 1718000002000 }
    ]
  },
  {
    userId: 'user2 raju',
    gps: [
      { lat: 9.6615, lng: 80.0255, timestamp: 1718000000000 }, // Jaffna
      { lat: 8.5750, lng: 81.2290, timestamp: 1718000005000 }, // Trincomalee
      { lat: 7.8731, lng: 80.7718, timestamp: 1718000010000 }  // Near central
    ],
    u2b: [
      { text: 'Passing Trinco now.', timestamp: 1718000001000 }
    ],
    b2u: [
      { text: 'Copy that. Log your next stop.', timestamp: 1718000002000 }
    ]
  }
],


  // Add a new user by userId only
  addUser: (userId) => set((state) => {
    const userExists = state.users.some(user => user.userId === userId)
    if (userExists) return state

    return {
      users: [
        ...state.users,
        {
          userId,
          gps: [],
          u2b: [],
          b2u: []
        }
      ]
    }
  }),

  // Add GPS data to a specific user
  // Add user → base text
  // Add b2u message to a specific user

  updateGps: (userId, gps) => set((state) => {
    return {
      users: state.users.map(user => {
        if (user.userId === userId) {
          return {
            ...user,
            gps: [...user.gps, ...gps]
          }
        }
        return user
      })
    }
  }),

  updateU2B: (userId, u2b) => set((state) => {
    return {
      users: state.users.map(user => {
        if (user.userId === userId) {
          return {
            ...user,
            u2b: [...user.u2b, ...u2b]
          }
        }
        return user
      })
    }
  }),

  updateB2U: (userId, b2u) => set((state) => {
    return {
      users: state.users.map(user => {
        if (user.userId === userId) {
          return {
            ...user,
            b2u: [...user.b2u, ...b2u]
          }
        }
        return user
      })
    }
  }),

  // Replace entire users array (useful for polling)
  setUsers: (updater) =>
    set((state) => {
      const newUsers =
        typeof updater === 'function' ? updater(state.users) : updater;
      return { users: newUsers };
    }),

}))

export default useUserStore
