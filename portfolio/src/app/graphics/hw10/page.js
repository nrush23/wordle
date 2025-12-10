"use client";
import Script from "next/script";
import Header from "../../components/header";

//testing
import React, { useState, useRef, useEffect } from 'react';
import ConnectRequestMessage from '../../../../public/boba/Network/connectRequest.js';
import GameSession from '../../../../public/boba/gameSession.js';
import NetworkClient from '../../../../public/boba/networkClient.js';
import InputManager from '../../../../public/boba/inputManager.js';
//end testing

const prefix = process.env.BASE_PATH || "";

export default function HW10() {

  const eventBus = useRef(createEventBus());
  const inputManager = useRef(new InputManager());
  const networkClient = useRef(new NetworkClient());
  const gameSession = useRef(new GameSession(eventBus.current,networkClient.current,inputManager.current));
 
  //trigger on component mount and unmount
useEffect(() => {
  inputManager.current.addListeners(document.getElementById("glcanvas"));
  return () => {
    // cleaning up the listeners here
    inputManager.current.removeListeners(document.getElementById("glcanvas"));
  }
}, []);
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 10: Gallery </div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-[rgb(204,255,255)] aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw10/hw10.js`}></Script>
        <Script src={`${prefix}/mesh.js`}></Script>
        <Script src={`${prefix}/parser.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); Parser.prefix = prefix; gl_start(canvas, new Scene(canvas,eventBus.current,gameSession.current));}}></Script>
        <div className="text-center ">Move around using WASD.</div>
        <div className="bg-gray-800 w-full h-150 flex flex-row gap-4 p-4">
          <ConnectMenu eventBus={eventBus.current}/>
          <LobbyScreen eventBus={eventBus.current}/>
        </div>
      </main>
    </div>
  );
}


const ConnectMenu = ({eventBus}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [logMessages, setLogMessages] = useState([
    { id: 0, text: 'System ready. Awaiting connection command.', type: 'info' },
  ]);

  const [username, setUsername] = useState("enter name here");
  const [secretKey, setSecretKey] = useState("enter secret key here");

  const logRef = useRef(null);
  const ws = useRef(null);
  // Function to simulate a connection attempt
  const handleConnectToggle = () => {
    eventBus.emit("gui:connectPressed")
  };


  // Function to add a new message to the log
  const addLogMessage = (text, type = 'info') => {
    console.log(text);

    setLogMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(), // or Date.now(), ensures unique ID
        text: `[${new Date().toLocaleTimeString()}] ${text}`,
        type
      }
    ]);
  };

  // Scroll to the bottom of the log whenever a new message is added
  // triggers when logMessages changes
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logMessages]);

  //trigger on component mount and unmount
  useEffect(() => {
    // adding event listeners on mount here
    const unsubscribe = eventBus.on("scene:log",(log)=>{
      addLogMessage(log);
    });
    return () => {
      // cleaning up the listeners here
      unsubscribe();
    }
  }, []);


  // Tailwind classes for log message types
  const logTypeStyles = {
    info: 'text-gray-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-800 rounded-xl shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">
        Server Connection Menu
      </h2>
      
      <div className="bg-white p-1 rounded-lg">
        <label className="block mb-1">
          <span className="text-gray-700">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter username"
          />
        </label>
        
        <label className="block mb-1">
          <span className="text-gray-700">Secret Host Key</span>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter secret key"
          />
        </label>
      </div>

      {/* --- Connect Button Section --- */}
      <div className="flex items-center justify-between">
        <span className={`text-lg font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className={`text-lg font-medium ${isHost ? 'text-green-400' : 'text-red-400'}`}>
          Status: {isHost ? 'isHost' : 'isClient'}
        </span>
        <button
          onClick={handleConnectToggle}
          className={`py-2 px-4 rounded-lg font-semibold shadow-md transition duration-200 ease-in-out
            ${isConnected
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* --- Scrollable Log Section --- */}
      <div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Connection Log</h3>
        
        {/* The log container with fixed height and scroll overflow */}
        <div
          ref={logRef}
          className="h-64 p-3 bg-gray-900 border border-gray-700 rounded-md overflow-y-scroll text-sm font-mono space-y-0.5"
        >
          {logMessages.map((msg) => (
            <p key={msg.id} className={logTypeStyles[msg.type]}>
              {msg.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};


//generate ws
//pass gui event handler to game
//let client interact with abstracted server api

const ServerConnectMenu = ({eventBus}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [logMessages, setLogMessages] = useState([
    { id: 0, text: 'System ready. Awaiting connection command.', type: 'info' },
  ]);

  const [username, setUsername] = useState("enter name here");
  const [secretKey, setSecretKey] = useState("enter secret key here");

  const logRef = useRef(null);
  const ws = useRef(null);
  // Function to simulate a connection attempt
  const handleConnectToggle = () => {
    if (isConnected) {
      // Disconnect Logic
      addLogMessage('Disconnecting...', 'warn');
      if(ws.current){
        /** @type {WebSocket} */
        let webSocket = ws.current;
        webSocket.close();
        ws.current = null;
        addLogMessage("web socket closed");
        setIsConnected(false);
      }
    } else {
      // Connect Logic
      addLogMessage('Attempting to connect to server...', 'info');
      // Create ws connection.
      ws.current = new WebSocket("ws://localhost:3001");
      /** @type {WebSocket} */
      let webSocket = ws.current;
      // Connection opened
      webSocket.addEventListener("open", (event) => {
        setIsConnected(true);
        addLogMessage("successfully connected to server");
        addLogMessage("sending message...");
        let conReqMsg = new ConnectRequestMessage(username,secretKey);
        webSocket.send(JSON.stringify(conReqMsg.serialize()));
      });

      // Listen for messages
      webSocket.addEventListener("message", (event) => {
        addLogMessage(event.data);
        let packet = JSON.parse(event.data);
        switch(packet.id){
          case 0:{
            addLogMessage(packet.uuid);
            if(packet.host){
              setIsHost(true);
            }
            eventBus.emit("net:connect",packet.uuid);
          }break;
          case 1:{
            addLogMessage(packet.uuids);
            let lobbyNames = packet.uuids.map(v=>({id:v,name:v,ping:-1}));
            eventBus.emit("scene:players",lobbyNames);
          }break;
          default:{
            addLogMessage("packet with invalid id received");
          }
        }
      });
      webSocket.addEventListener("error",(webSocket,event)=>{
        addLogMessage(event);
        setIsConnected(false);
      });
      webSocket.addEventListener("close",(event)=>{
        addLogMessage(event.reason);
      });
    }
  };

  // Function to add a new message to the log
  const addLogMessage = (text, type = 'info') => {
    console.log(text);

    setLogMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(), // or Date.now(), ensures unique ID
        text: `[${new Date().toLocaleTimeString()}] ${text}`,
        type
      }
    ]);
  };

  // Scroll to the bottom of the log whenever a new message is added
  // triggers when logMessages changes
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logMessages]);

  //trigger on component mount and unmount
  useEffect(() => {
    // adding event listeners on mount here
    const unsubscribe = eventBus.on("scene:log",(log)=>{
      addLogMessage(log);
    });
    return () => {
      // cleaning up the listeners here
      unsubscribe();
    }
  }, []);


  // Tailwind classes for log message types
  const logTypeStyles = {
    info: 'text-gray-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-800 rounded-xl shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">
        Server Connection Menu
      </h2>
      
      <div className="bg-white p-1 rounded-lg">
        <label className="block mb-1">
          <span className="text-gray-700">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter username"
          />
        </label>
        
        <label className="block mb-1">
          <span className="text-gray-700">Secret Host Key</span>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter secret key"
          />
        </label>
      </div>

      {/* --- Connect Button Section --- */}
      <div className="flex items-center justify-between">
        <span className={`text-lg font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className={`text-lg font-medium ${isHost ? 'text-green-400' : 'text-red-400'}`}>
          Status: {isHost ? 'isHost' : 'isClient'}
        </span>
        <button
          onClick={handleConnectToggle}
          className={`py-2 px-4 rounded-lg font-semibold shadow-md transition duration-200 ease-in-out
            ${isConnected
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* --- Scrollable Log Section --- */}
      <div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Connection Log</h3>
        
        {/* The log container with fixed height and scroll overflow */}
        <div
          ref={logRef}
          className="h-64 p-3 bg-gray-900 border border-gray-700 rounded-md overflow-y-scroll text-sm font-mono space-y-0.5"
        >
          {logMessages.map((msg) => (
            <p key={msg.id} className={logTypeStyles[msg.type]}>
              {msg.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerList = ({ players }) => {
  return (
    <div className="w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2">
        Connected Players
      </h2>

      {players.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No players connected.</p>
      ) : (
        <ul className="space-y-2">
          {players.map(player => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-md shadow-sm hover:bg-gray-600 transition"
            >
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                <span className="font-medium">{player.name}</span>
              </div>

              {/* Optional: Ping or status text */}
              {player.ping && (
                <span className="text-gray-300 text-xs">
                  {player.ping}ms
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function LobbyScreen({eventBus}) {
  const [players, setPlayers] = React.useState([
    { id: "1", name: "DummyPlayerOne", ping: 42 },
    { id: "2", name: "readyPlayerTwo", ping: 88 }
  ]);
  useEffect(() => {
    // adding event listeners on mount here
    const unsubscribe = eventBus.on("scene:players",(players)=>{
      setPlayers(players.map(p=>({...p})));// create shallow copy of player to leave data unmutable
    });
    return () => {
      // cleaning up the listeners here
      unsubscribe();
    }
  }, []);
  return (
    <div className="p-6">
      <PlayerList players={players} />
    </div>
  );
}

//staging
//simple event bus pattern
export function createEventBus() {
  const listeners = new Map(); // eventName -> Set<callback>

  return {
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);

      // Return unsubscribe
      return () => {
        listeners.get(event)?.delete(callback);
      };
    },

    off(event, callback) {
      listeners.get(event)?.delete(callback);
    },

    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const cb of set) cb(payload);
    },
  };
}
//end staging
