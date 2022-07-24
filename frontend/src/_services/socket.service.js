
import { io } from 'socket.io-client'

export const socket = io('api.pacer.codes/', {
  transports: ['websocket'],
});











