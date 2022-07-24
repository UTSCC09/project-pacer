
import { io } from 'socket.io-client'

export const socket = io('localhost', {
  transports: ['websocket'],
  extraHeaders: {
    "Host": "api.pacer.codes"
  }
});











