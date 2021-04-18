const socket = io()

//Elements
const $messageForm = document.querySelector("#message-form") //o $ não tem função especifica, é apenas o modo da convenção de identificar Elements
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $showLocationButton = document.querySelector("#show-location")
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    // Height & Margin of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format("HH:mm")
  })
  $messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("locationMessage", (message) => {
  console.log(message)
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("HH:mm")
  })
  $messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
      room,
      users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value //isto é possivel porque demos o nome "message" ao input

    socket.emit("sendMessage", message, () => {
      $messageFormButton.removeAttribute("disabled")
      $messageFormInput.value = ""
      $messageFormInput.focus()
      console.log("Delivered")
    })
})

$showLocationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }

    $showLocationButton.setAttribute("disabled", "disabled")
    
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }, () => {
            $showLocationButton.removeAttribute("disabled")
            console.log("Location shared!")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
      alert(error)
      location.href="/"
    }
})