
import { io } from 'socket.io-client'

export const socket = io('http://localhost', {
  transports: ['websocket'],
  extraHeaders: {
    "Host": "api.pacer.codes"
  }
});











