import { useEffect, useRef, useState } from 'react';
import CosmicBackground from './components/CosmicBackground';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const socket = useRef(null);
  const [clients, setClients] = useState(0);
  const messagesEndRef = useRef(null);

  const connectToChat = () => {
    if (!username.trim() || !description.trim()) return;
    setError('');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT ? `:${import.meta.env.VITE_WS_PORT}` : '';
    const wsUrl = `${protocol}//${wsHost}${port}/ws`;
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      setIsConnected(true);
      setError('');
      // Send initial user info
      socket.current.send(JSON.stringify({ 
        type: 'user_info',
        username,
        description
      }));
      
      const apiUrl = `${window.location.protocol}//${window.location.hostname}${port}/api/v1/chat`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          setUsers(data);
          setClients(data.length);
        })
        .catch(error => {
          console.error('Error fetching clients:', error);
          setUsers([]);
          setClients(0);
        });
    };

    socket.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'user_list') {
          setUsers(msg.users);
          setClients(msg.users.length);
        } else {
          setMessages(prev => [...prev, msg]);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
        setError('Error receiving message from server');
      }
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to chat server');
    };

    socket.current.onclose = () => {
      setIsConnected(false);
      setUsers([]);
      setError('Disconnected from chat server');
    };
  };

  useEffect(() => {
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input || !username) return;

    try {
      socket.current.send(JSON.stringify({ username, text: input }));
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const isSendDisabled = !username.trim() || !input.trim();
  const isConnectDisabled = !username.trim() || !description.trim();

  return (
    <div className="min-h-screen relative py-4 px-2 sm:py-8 sm:px-6 lg:px-8">
      <CosmicBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-gray-800/30 backdrop-blur-md rounded-lg shadow-lg p-4 sm:p-6 border border-orange-500/20 flex flex-col sm:flex-row">
          {!isConnected ? (
            <div className="w-full space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-4 sm:mb-6 text-center">
                Solaris Chat
              </h1>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 text-red-400 text-center text-sm sm:text-base">
                  {error}
                </div>
              )}
              <input
                type="text"
                placeholder="Your cosmic name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 bg-gray-700/50 border border-orange-500/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-white placeholder-gray-400 text-sm sm:text-base"
              />
              <textarea
                placeholder="Tell us about yourself..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 bg-gray-700/50 border border-orange-500/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-white placeholder-gray-400 h-24 sm:h-32 resize-none text-sm sm:text-base"
              />
              <button
                onClick={connectToChat}
                disabled={isConnectDisabled}
                className={`w-full px-4 sm:px-6 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                  isConnectDisabled
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900'
                }`}
                title={isConnectDisabled ? "Please enter your name and description" : "Join the chat"}
              >
                Join the Chat
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 pr-0 sm:pr-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-4 sm:mb-6 text-center">
                  Solaris Chat
                </h1>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 text-red-400 text-center text-sm sm:text-base">
                    {error}
                  </div>
                )}

                <div className="bg-orange-500/10 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 text-center border border-orange-500/20">
                  <span className="text-orange-400 font-medium text-sm sm:text-base">Connected Stars: {clients}</span>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-3 sm:p-4 h-64 sm:h-96 overflow-y-auto mb-4 sm:mb-6 border border-orange-500/20 backdrop-blur-sm">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg ${
                        msg.username === username 
                          ? 'bg-orange-500/20 ml-auto max-w-[90%] sm:max-w-[80%] border border-orange-500/30' 
                          : 'bg-gray-700/50 max-w-[90%] sm:max-w-[80%] border border-gray-600/30'
                      }`}
                    >
                      <span className={`font-semibold text-sm sm:text-base ${
                        msg.username === username ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {msg.username}:
                      </span>
                      <p className="text-gray-200 mt-1 text-sm sm:text-base">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a cosmic message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isSendDisabled && sendMessage()}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-700/50 border border-orange-500/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-white placeholder-gray-400 text-sm sm:text-base"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSendDisabled}
                    className={`px-4 sm:px-6 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      isSendDisabled
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900'
                    }`}
                    title={isSendDisabled ? "Please enter a message" : "Send message"}
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="w-full sm:w-64 bg-gray-800/30 rounded-lg p-3 sm:p-4 mt-4 sm:mt-0 border border-orange-500/20 backdrop-blur-sm">
                <h2 className="text-lg sm:text-xl font-semibold text-orange-400 mb-3 sm:mb-4">Connected Stars</h2>
                <div className="space-y-2 sm:space-y-3">
                  {users.map((user, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600/30">
                      <div className="font-semibold text-orange-400 text-sm sm:text-base">{user.username}</div>
                      <div className="text-xs sm:text-sm text-gray-300 mt-1">{user.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
