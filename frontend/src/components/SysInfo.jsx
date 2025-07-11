
import { useEffect } from 'react'
import useSerialStore from '../stores/useSerialStore'

function SysInfo() {
  const isSerialConnected = useSerialStore(state => state.isSerialConnected)
 
  const updateStatus = useSerialStore(state => state.updateStatus)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:3000/status')
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`)
        }
        const status = await res.json()
        updateStatus(status)
        console.log('Updating STATUS...')
      } catch (error) {
        console.error('Fetch error:', error.message)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [updateStatus])

  /*return (
    <div className={`h-20 ${isSerialConnected ? 'bg-green-400' : 'bg-red-400'} flex items-center justify-center`}>
      <p>Status: {isSerialConnected ? 'Connected' : 'Not Connected'}</p>
      
    </div>
  )*/ 
 return (
  <div className="h-20 w-full bg-gray-200 flex items-center justify-center rounded-xl">
    {/* Outer Div - Largest */}
    
    <div className="h-16 w-4/5 bg-gray-100 flex items-center justify-center rounded-xl">
      {/* Middle Div - Medium */}
      
      <div className={`h-12 w-3/5 flex items-center justify-center rounded-md`}>
  <button
    className={`h-6 w-6 rounded-full ${isSerialConnected ? 'bg-green-500' : 'bg-red-500'}`}
    title={isSerialConnected ? 'Connected' : 'Not Connected'}
  />
  <span className="ml-3 text-black font-semibold">
    {isSerialConnected ? 'Connected' : 'Not Connected'}
  </span>
</div>


    </div>
  </div>
);



}

export default SysInfo
