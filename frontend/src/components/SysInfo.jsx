import { useEffect } from 'react'
import useSerialStore from '../stores/useSerialStore'
import SessionSelector from './SessionSelector'

function SysInfo() {
  const isSerialConnected = useSerialStore((state) => state.isSerialConnected)
  const updateStatus = useSerialStore((state) => state.updateStatus)

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

  return (
    <div className="w-full bg-gray-100 p-4 rounded-xl shadow flex flex-col gap-4">
      {/* ESP32 Status box */}
      <div className="inline-flex items-center border-2 border-gray-400 rounded-lg px-4 py-2">
        <div
          className={`h-5 w-5 rounded-full ${
            isSerialConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isSerialConnected ? 'Connected' : 'Not Connected'}
        />
        <span className="ml-3 font-semibold text-gray-800 text-lg whitespace-nowrap">
          ESP32: {isSerialConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {/* Session selector below inside the same box */}
      <SessionSelector />
    </div>
  )
}

export default SysInfo
