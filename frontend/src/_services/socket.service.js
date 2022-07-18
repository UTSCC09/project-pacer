
import { io } from 'socket.io-client'

export const socket = io('http://pacer.codes:8080/', {
  transports: ['websocket'],
});











