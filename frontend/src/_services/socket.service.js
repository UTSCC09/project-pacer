
import { io } from 'socket.io-client'

export const socket = io('https://pacer.codes', {
  transports: ['websocket'],
  extraHeaders: {
    "Host": "api.pacer.codes"
  }
});











