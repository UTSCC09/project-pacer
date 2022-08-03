
import { io } from 'socket.io-client'

export const socket = io('https://api.pacer.codes', {
  autoConnect: false,
  transports: ['websocket']
});











