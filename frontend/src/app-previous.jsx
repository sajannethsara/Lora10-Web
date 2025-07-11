import { useEffect, useState } from 'react'
import useSerialStore from './stores/useSerialStore'
import useUserStore from './stores/useUserStore'

const App = () => {
  const [abc,setAbc] = useState(false)
  const isSerialConnected = useSerialStore(state => state.isSerialConnected)
  const updateStatus = useSerialStore(state => state.updateStatus)
  const baudRate = useSerialStore(state => state.baudRate)
  const port = useSerialStore(state => state.port)
  
  const users = useUserStore(state => state.users)
  const setUsers = useUserStore(state => state.setUsers)

  // Poll backend every 5 seconds to update users (no merging, just replace)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:3000/status');
        if (!res.ok) {
          const errorText = await res.text();

          throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const status = await res.json();
        //setAbc(status.isSerialConnected)
        updateStatus(status); // Update serial store with new status

        console.log('Updating STATUS...') // Directly set status from backend

        console.log('Serial connection status:', status);
      } catch (error) {
        console.error('Fetch error:', error.message);
      }
    }
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/data');
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const backendUsers = await res.json();
        setUsers(backendUsers);
        console.log('Updating DATA...') // Directly set users from backend
      } catch (error) {
        console.error('Fetch error:', error.message);
      }
    };

    fetchUsers(); // initial fetch
    fetchStatus(); // initial status fetch
    const interval = setInterval(fetchUsers, 1000)
    const Statusinterval = setInterval(fetchStatus, 5000)


    return () => {
      clearInterval(Statusinterval);
      clearInterval(interval);
    }
  }, [setUsers,updateStatus])

  return (
    <div>
      <div>
        The status of esp32 serial connection and user data
        <p> IS Server Connected to Esp32 : {abc ? 'Yes' : 'No'}</p>
        ----
      </div>
      <div>
        <h2>Serial Connection</h2>
        <p>Connected: {isSerialConnected ? 'Yes' : 'No'}</p>
        <p>Baud Rate: {baudRate}</p>
        <p>Port: {port}</p><br />
      </div>

      <div>
        <h2>User Details:</h2>
        {users.length === 0 ? (
          <p>No users available</p>
        ) : (
          users.map(user => (
            <div key={user.userId}>
              <p>User ID: {user.userId}</p>
              <p>User Name : {user.userName}</p>
              <p>
                GPS:
                {user.gps.length > 0
                  ? user.gps.map((gps, index) => (
                      <span key={index}>
                        {gps.lat}, {gps.lng} at {new Date(gps.timestamp).toLocaleString()}
                        {index < user.gps.length - 1 ? '; ' : ''}
                      </span>
                    ))
                  : 'No GPS data'}
              </p>
              <p>
                User to Base message:{' '}
                {user.u2b?.length > 0 ? user.u2b[0].text : 'No messages'}
              </p>
              <p>
                Base to User message:{' '}
                {user.b2u?.length > 0 ? user.b2u[0].text : 'No messages'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


export default App

