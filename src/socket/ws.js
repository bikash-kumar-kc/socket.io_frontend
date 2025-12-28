import { io } from 'socket.io-client'; // importing socket io client


 const socketIoConnectionToServer = ()=>{
return io(import.meta.env.VITE_SOCKET_URL,{
    transports:["polling","websocket"]
});
};


export default socketIoConnectionToServer;

