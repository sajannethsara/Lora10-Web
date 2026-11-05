import { useEffect } from 'react'
import useSerialStore from '../stores/useSerialStore'
import SessionSelector from './SessionSelector'

function SysInfo() {
  const isSerialConnected = useSerialStore((state) => state.isSerialConnected)
  const updateStatus = useSerialStore((state) => state.updateStatus)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/status')
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const status = await res.json()
        updateStatus(status)
      } catch (error) {
        console.error('Fetch error:', error.message)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [updateStatus])

  return (
    <div className="flex flex-col gap-3">
      {/* Connection pill */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-300 ${
          isSerialConnected
            ? 'bg-green-900/30 border-green-700/40 text-green-300'
            : 'bg-red-900/30 border-red-700/40 text-red-300'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${
            isSerialConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
        />
        <span className="truncate">
          Base Station &nbsp;·&nbsp;
          {isSerialConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Session selector */}
      <SessionSelector />
    </div>
  )
}

export default SysInfo
