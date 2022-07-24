
import { io } from 'socket.io-client'

export const socket = io('http://pacer.codes', {
  transports: ['websocket'],
  extraHeaders: {
    "Host": "api.pacer.codes"
  }
});











