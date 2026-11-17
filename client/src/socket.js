import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

export default socket;
