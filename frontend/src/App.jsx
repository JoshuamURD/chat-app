import { useEffect, useRef, useState } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const socket = useRef(null);
  const [clients, setClients] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
    socket.current = new WebSocket(wsUrl);

    socket.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => [...prev, msg]);
    };

    socket.current.onopen = () => {
      const apiUrl = `http://${window.location.hostname}:8080/api/v1/chat`;
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

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Chat App</h1>
          
          <div className="bg-blue-50 rounded-lg p-3 mb-6 text-center">
            <span className="text-blue-600 font-medium">Connected Clients: {clients}</span>
          </div>

          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />

          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-6">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`mb-3 p-3 rounded-lg ${
                  msg.username === username 
                    ? 'bg-blue-100 ml-auto max-w-[80%]' 
                    : 'bg-gray-200 max-w-[80%]'
                }`}
              >
                <span className="font-semibold text-gray-700">{msg.username}:</span>
                <p className="text-gray-800 mt-1">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
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
