/*import Mapbox from './components/mapbox'
import SysInfo from './components/SysInfo'
import UserPanel from './components/UserPanel'

import useUserStore from './stores/useUserStore'

const App = () => {
  const users = useUserStore(state => state.users)
  return (
    <div className="bg-yellow-200 flex flex-1 h-screen w-full">
      <div className="bg-red-200 flex-1">
        <div>
        <SysInfo/>
        </div>
        <div>
          <UserPanel/>
        </div>
      </div>
      <div className="bg-green-200 flex flex-3">
        
         <Mapbox users={users} highlightedUserId={'user1'} /> 
        
      </div>
    </div>
  )
}

export default App */ 

// react arrow function component

import React, { useState } from 'react';
import Mapbox from './components/mapbox';
import SysInfo from './components/SysInfo';
import UserPanel from './components/UserPanel';
import useUserStore from './stores/useUserStore';

const App = () => {
  const users = useUserStore(state => state.users);
  const [highlightedUserId, setHighlightedUserId] = useState(null); // 👈 state for selected user

  return (
    <div className="bg-yellow-200 flex flex-1 h-screen w-full">
      <div className="bg-red-200 flex-1">
        <div>
          <SysInfo />
        </div>
        <div>
          {/* 👇 pass setter to UserPanel */}
          <UserPanel
            users={users}
            highlightedUserId={highlightedUserId}
            onSelectUser={setHighlightedUserId}
          />
        </div>
      </div>

      <div className="bg-green-200 flex flex-3">
        {/* 👇 pass selected user to Mapbox */}
        <Mapbox users={users} highlightedUserId={highlightedUserId} />
      </div>
    </div>
  );
};

export default App;
