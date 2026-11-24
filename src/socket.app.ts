import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import AppError from '@app/error/AppError.js';
import httpStatus from 'http-status';
import getUserDetailsFromToken from '@app/helpers/getUserDetailsFromToken.js';

let connectedUser = [];
const userIdToGetSocketId = new Map<string, string>()
const SocketIdToGetUserId = new Map<string, string>()



const getSocketId = (userId:string)=>{
  const socketId = userIdToGetSocketId.get(userId)

  return socketId
}
const getUserId = (socketId:string)=>{
  const userId = SocketIdToGetUserId.get(socketId)

  return userId
}

const initiateSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', socket => {
    
    const token =
      socket?.handshake?.auth?.token || socket?.handshake?.headers?.token;
    const user:any = getUserDetailsFromToken(token);

    userIdToGetSocketId.set(user?.id, socket?.id)
    SocketIdToGetUserId.set(socket?.id, user?.id)
    connectedUser.push(user?.id);
    socket.join(user?.id)


    socket?.on("onlineUser", (data, callBack)=>{

      try {
        io.to(socket?.id).emit("onlineUser", connectedUser)
        if(callBack){
          callBack({
            success:true,
            message:"online user get successfully ",
            data: connectedUser
          })
        }
      } catch (error) {
        console.log("🚀 ~ initiateSocketServer ~ error:", error)
         if(callBack){
          callBack({
            success:false,
            message:"online user get filed ",
            data: null
          })
        
      }
    }
    }
    )
    
    socket.on('join', async data => {
      io.emit('getData', {
        data: `My Name is : ${data?.name}`,
        email: 'example@gail.com',
      });
      console.log(data);
    });

    socket.on('disconnect', () => {
      console.log(`A user Disconnect: `, socket?.id);
      userIdToGetSocketId.delete(user?.id)
      SocketIdToGetUserId.delete(socket?.id)
    });
  });

  return io;
};

export default initiateSocketServer;
