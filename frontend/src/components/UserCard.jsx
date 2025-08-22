import React from 'react';
import userIMG from '../assets/user2.svg';
import antennaIMG from '../assets/antena2.svg';

function UserCard({ user, onClick, isSelected }) {
  const latestGps = Array.isArray(user.gps) && user.gps.length > 0
    ? user.gps[user.gps.length - 1]
    : null;

  return (
    <div
      onClick={() => onClick(user.userId)}
      className={`flex rounded-lg p-1 m-2 cursor-pointer transition-shadow
        ${isSelected
          ? '  bg-[#353535] shadow-md'
          : '  bg-[#232222] shadow-sm'}
        hover:shadow-lg hover: hover:bg-[#555555] transition-all duration-200 ease-in-out
      `}
    >
      <div className='flex items-center justify-center'>
        {user.userId > 26
          ? <img className='h-8 w-12 justify-center' src={userIMG} alt="" />
          : <img className='h-8 w-12 justify-center' src={antennaIMG} alt="" />}
      </div>

      <div className="ml-4 flex flex-col justify-center">
        <p className="text-m text-white">
          {user.username} <span className="text-[#1ae81a70] self-end">: {user.userId}</span>
        </p>
        <p className="text-sm text-green-200">
          {latestGps
            ? `Last GPS update: ${new Date(latestGps.currenttime || latestGps.timestamp).toLocaleString()}`
            : 'No GPS data available'}
        </p>
      </div>
    </div>
  );
}

export default UserCard;
