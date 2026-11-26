import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import AppError from '@app/error/AppError.js';
import httpStatus from 'http-status';
import getUserDetailsFromToken from '@app/helpers/getUserDetailsFromToken.js';
import { getMyChatList } from '@app/module/chatList/chtlist.service.js';
import prisma from '@app/shared/prisma.js';
import callbackFn from '@app/utils/callbackFn.js';

let connectedUser = new Set()
const userIdToGetSocketId = new Map<string, string>()
const SocketIdToGetUserId = new Map<string, string>()



const getSocketId = (userId:string):string|any=>{
  const socketId = userIdToGetSocketId.get(userId)

  return socketId 
}
const getUserId = (socketId:string):string|any=>{
  const userId = SocketIdToGetUserId.get(socketId)

  return userId 
}

const initiateSocketServer =  (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', async(socket) => {
    
    const token =
      socket?.handshake?.auth?.token || socket?.handshake?.headers?.token;
    const user:any = await getUserDetailsFromToken(token); 

    userIdToGetSocketId.set(user?.id, socket?.id)
    SocketIdToGetUserId.set(socket?.id, user?.id)
    connectedUser.add(user?.id);
    socket.join(user?.id) 

    socket?.on("onlineUser", (data, callBack)=>{

      try {
        io.to(socket?.id).emit("onlineUser", Array.from(connectedUser))
        if(callBack){
          callBack({
            success:true,
            message:"online user get successfully ",
            data: Array.from(connectedUser)
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

    socket?.on("my-chat-list", async(data, callback)=>{
      const userId = data?.userId ?? user?.id
      const chatList = await getMyChatList(userId)
      console.log("🚀 ~ initiateSocketServer ~ chatList:", chatList)
    })


//  id String @id @default(auto()) @map("_id") @db.ObjectId
//   chatId String  @db.ObjectId
//   text String?
//   mgUrl String?
//   isSeen Boolean @default(false)
//   receiverId String @db.ObjectId
//   senderId String @db.ObjectId
    // send message

    interface IMessage {
  chatId:string,
  text?:string,
  mgUrl?:string,
  receiverId:string,
  senderId:string,
}
    socket.on("send-message", async(data, callback)=>{
    // let chat:any

 
    const isExists = await prisma?.chats?.findFirst({
      where:{
        participant:{
          some:{
            userId:{
              in:[data?.senderId, data?.receiverId]
            }
          }
        }, 
      },
      select:{
        id:true
      }
    
    })

    if(!isExists){
        const newChat = await prisma?.chats?.create({
          data:{
            status:"active",
            participant:{
              create:[
                {
                  userId: data?.senderId
                },
                {
                  userId: data?.receiverId
                }
              ]
            }
          },
          include:{
            participant:true
          }
        })

  if(!newChat) {
          io.to(socket?.id).emit("error", { 
            success:false, 
            message:"Chat creation filed!",
            data:null
          })
          throw callbackFn(callback, {
            success:false, 
            message:"Chat creation filed!",
            data:null
          })
        }

          data["chatId"] = newChat?.id
    }else{
      data["chatId"] = isExists?.id
    }
    

      const messageData:IMessage ={
          chatId: data?.chatId,
          text: data?.text,
          mgUrl: data?.mgUrl,
          receiverId: data?.receiverId,
          senderId: user?.id,
      }


      const message = await prisma?.message?.create({
        data: messageData
      })

        if(!message) {
          io.to(socket?.id).emit("error", { 
            success:false, 
            message:"Message send filed!",
            data:null
          })
          throw callbackFn(callback, {
            success:false, 
            message:"Message send filed!",
            data:null
          })
        }

    const receiverSocketId = await getSocketId(message?.receiverId) as string

     if(receiverSocketId){
       io.to(receiverSocketId).emit("new-message", {
        success:true, 
        message:"get a new message",
        data: message
      })

       io.to(socket?.id).emit("new-message", {
        success:true, 
        message:"get a new message",
        data: message
      })
     }

     callbackFn(callback, {
            success:true, 
            message:"get a new message",
            data: message
          })





    })


    
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
      connectedUser.delete(user?.id)
    });
  });

  return io;
};

export default initiateSocketServer;
