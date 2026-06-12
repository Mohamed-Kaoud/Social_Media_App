import { Server } from "socket.io"
import {Server as HttpServer} from "http"
import { decodeToken_and_fetchUser } from "../../common/middleware/authentication"
import redisService from "../../common/service/redis.service"
import chatGateway from "../chat/realtime/chat.gateway"

class SocketGateway {
    constructor(){}

    initIO = async (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  })

  io.use(async (socket, next) => {
    try {
      const result = await decodeToken_and_fetchUser(
        socket.handshake.auth.authorization || socket.handshake.headers.authorization
      )
      socket.data.user = result.user;
      socket.data.decoded = result.decoded;
      next()
    } catch (error: any) {
      next(error)
    }
  })

  io.on("connection", async (socket) => {
    redisService.addSocket({userId: socket.data.user._id, SocketId: socket.id})

    await chatGateway.registerEvent(socket,io)

    socket.on("disconnect", async () => {
      await redisService.removeSocket({userId: socket.data.user._id, SocketId: socket.id})
      
    })
    
  })
    }
}

export default new SocketGateway()