import React, { useState } from 'react';
import Room from '../src/components/Room';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  const handleJoinRoom = () => {
    if (userName && roomId) {
      setIsInRoom(true);
    } else {
      alert('Lütfen kullanıcı adınızı ve oda numarasını girin.');
    }
  };

  if (isInRoom) {
    return <Room roomId={roomId} userId={userName} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Odaya Katıl</h1>
      <input
        type="text"
        placeholder="Kullanıcı Adı"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Oda Numarası"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="p-2 mb-2 border rounded"
      />
      <button onClick={handleJoinRoom} className="p-2 bg-blue-500 text-white rounded">
        Odaya Katıl
      </button>
    </div>
  );
};

export default App;
