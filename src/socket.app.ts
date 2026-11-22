import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import AppError from '@app/error/AppError.js';
import httpStatus from 'http-status';
import getUserDetailsFromToken from '@app/helpers/getUserDetailsFromToken.js';

let connectedUser = [];
const initiateSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', socket => {
    connectedUser.push(socket?.id);

    // try {
    //   const token =
    //     socket?.handshake?.auth?.token || socket?.handshake?.headers?.token;
    //   const user = getUserDetailsFromToken(token);
    // } catch (error) {
    //   throw new AppError(httpStatus?.UNAUTHORIZED, 'Invalid Token');
    //   console.log(error);
    // }

    // console.log('A user connected: ' + socket?.id);

    // console.log(connectedUser);

    // // sed event
    
    
    socket.on('join', async data => {
      io.emit('getData', {
        data: `My Name is : ${data?.name}`,
        email: 'example@gail.com',
      });
      console.log(data);
    });

    socket.on('disconnect', () => {
      console.log(`A user Disconnect: `, socket?.id);
    });
  });

  return io;
};

export default initiateSocketServer;
