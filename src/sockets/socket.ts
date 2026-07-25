import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from 'http';
import socketConfig from "../config/socket/socket.config";
import { ACCEPT_INVITE, RECEIVE_INVITE, REJECT_INVITE, SEND_INVITE } from "./emitters/emitter.invite";
import { ACCEPT_INVITE_FN, REJECT_INVITE_FN,  SEND_AND_RECEIVE_INVITE_FN } from "./events/event.invite";

let io: Server;

const onlineUsers = new Map<string, string>();


const initSocket = (mainServer: http.Server) => {



    io = socketConfig(mainServer);
    // ADD AUTH MIDDLEWARE GAVE PERMANENTLY ADDRESS

    io.use((socket,next)=>{
        const token =socket.handshake.auth?.token;
          if (!token) return next(new Error("Unauthorized: no token"));

           try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
            socket.data.userId = decoded.id; 
         
            next();
        } catch {
            next(new Error("Unauthorized: invalid token"));
        }
    })



    io.on("connection", (socket) => {

        console.log("[Conncted User] : =>", socket.data.userId)
        onlineUsers.set("name", socket.id);



        socket.on(SEND_INVITE, (data) => {
          SEND_AND_RECEIVE_INVITE_FN(io,socket,data);
        })

        socket.on(ACCEPT_INVITE,(data)=>{
            ACCEPT_INVITE_FN(io,socket,data);
         
        })
        socket.on(REJECT_INVITE,(data)=>{
          REJECT_INVITE_FN(io,socket,data);
        })
        // TASK SHARE   
        


   




        console.log(onlineUsers);


        socket.on("disconnect", () => {
            console.log("[Disconnect] : this user => ", socket.id)
        })

    })



}


export default initSocket;




