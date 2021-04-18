const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")


const app = express()
const server = http.createServer(app) //Não é necessário, a express library faz isto automaticamente. Aqui apenas o fazemos manualmente porcausa do socketio
const io = socketio(server)

const port = process.env.PORT || 5000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))


io.on("connection", (socket) => { //io.on aplica-se quando algum socket se connecta
    console.log("New WebSocket connection")

    socket.on("join", ({ username, room}, callback) => {
        const { error, user} = addUser({ id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin","Welcome!")) //socket.emit emite algo para algum socket(utilizador) em particular
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin",`${user.username} has joined!`)) //socket.broadcast.emit emite algo para todos os sockets excepto para o socket que emitiu. Neste caso usamos "to" para especificar que só deve emitir para a room em especifico
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on("sendMessage", (message, callback) => {

        const user = getUser(socket.id)
      
        io.to(user.room).emit("message", generateMessage(user.username, message)) //io.emit emite algo para todos os sockets inclusive para o socket que emitiu. Neste caso usamos "to" para especificar que só deve emitir para a room em especifico
        callback()
    })

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback() //Isto permite a parte do código referente à entrega da mensagem
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left.`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
}) 

server.listen(port, () => {
  console.log("Server is up on port " + port)
})
