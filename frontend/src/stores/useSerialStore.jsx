import {create} from 'zustand'


const useSerialStore = create(set => ({
  isSerialConnected: false,
  baudRate: 9600,
  port: '2390',
  // function to update the entire store state
  updateStatus: (data) => set(state => ({
    isSerialConnected: data.isSerialConnected,
    baudRate: data.baudRate,
    port: data.port,
  }))
}));

export default useSerialStore;