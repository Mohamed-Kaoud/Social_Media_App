import { Server, Socket } from "socket.io";
import chatService from "../chat.service";

class ChatEvent {
    constructor() { }

    sayHi = async (socket: Socket, io: Server) => {
        socket.on("sayHi", (data) => {
           chatService.sayHi(data, socket, io)
        })
    }

     sendMessage = async (socket: Socket, io: Server) => {
        socket.on("sendMessage", (data) => {
           chatService.sendMessage(data, socket, io)
        })
    }

       join_room = async (socket: Socket, io: Server) => {
        socket.on("sendMessage", (data) => {
           chatService.join_room(data, socket, io)
        })
    }

        sendGroupMessage = async (socket: Socket, io: Server) => {
        socket.on("sendMessage", (data) => {
           chatService.sendGroupMessage(data, socket, io)
        })
    }
}

export default new ChatEvent()