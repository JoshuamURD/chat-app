import { useEffect, useRef, useState } from 'react';
import CosmicBackground from './components/CosmicBackground';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const socket = useRef(null);
  const [clients, setClients] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socket.current = new WebSocket(wsUrl);

    socket.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => [...prev, msg]);
    };

    socket.current.onopen = () => {
      const apiUrl = `${window.location.protocol}//${window.location.host}/api/v1/chat`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          setClients(data);
        })
        .catch(error => {
          console.error('Error fetching clients:', error);
          setClients([]);
        });
    };
    return () => socket.current.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input || !username) return;

    socket.current.send(JSON.stringify({ username, text: input }));
    setInput('');
  };

  const isSendDisabled = !username.trim() || !input.trim();

  return (
    <div className="min-h-screen relative py-8 px-4 sm:px-6 lg:px-8">
      <CosmicBackground />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-gray-800/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-orange-500/20">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-6 text-center">
            Solaris Chat
          </h1>
          
          <div className="bg-orange-500/10 rounded-lg p-3 mb-6 text-center border border-orange-500/20">
            <span className="text-orange-400 font-medium">Connected Stars: {clients}</span>
          </div>

          <input
            type="text"
            placeholder="Your cosmic name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-gray-700/50 border border-orange-500/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-white placeholder-gray-400"
          />

          <div className="bg-gray-800/30 rounded-lg p-4 h-96 overflow-y-auto mb-6 border border-orange-500/20 backdrop-blur-sm">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`mb-3 p-3 rounded-lg ${
                  msg.username === username 
                    ? 'bg-orange-500/20 ml-auto max-w-[80%] border border-orange-500/30' 
                    : 'bg-gray-700/50 max-w-[80%] border border-gray-600/30'
                }`}
              >
                <span className={`font-semibold ${
                  msg.username === username ? 'text-orange-400' : 'text-gray-300'
                }`}>
                  {msg.username}:
                </span>
                <p className="text-gray-200 mt-1">{msg.text}</p>
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
              className="flex-1 px-4 py-2 bg-gray-700/50 border border-orange-500/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-white placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={isSendDisabled}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                isSendDisabled
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900'
              }`}
              title={isSendDisabled ? "Please enter your name and a message" : "Send message"}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
