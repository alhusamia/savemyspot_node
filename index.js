var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/",
});

function getRestaurantQ(socket, restaurantID, user) {
  instance
    .get(`queue/list/`, { data: { restaurant: restaurantID } })
    .then((res) => res.data)
    .then((queue) => {
      socket.join(queue.id);
      let found = false;
      if (queue.length > 0) {
        queue.forEach((spot) => {
          if (user !== null && spot.user.id === user) {
            io.to(socket.id).emit("user spot", {
              spot: spot,
            });
            found = true;
          }
        });
        if (!found) {
          io.to(socket.id).emit("user spot", {
            spot: null,
          });
        }
        io.to(socket.id).emit("q info", {
          restaurantQ: queue[0].position,
        });
      } else {
        io.to(socket.id).emit("q info", {
          restaurantQ: 0,
        });
        io.to(socket.id).emit("user spot", {
          spot: null,
        });
      }
    })
    .catch((err) => console.error(err));
}

io.on("connection", function (socket) {
  socket.on("restaurant room", function (data) {
    socket.join(data.restaurant.id);
    getRestaurantQ(socket, data.restaurant.id, data.user);
  });
  socket.on("back", function (data) {
    socket.leave(data);
  });
  socket.on("join q", function (data) {
    axios
      .post("http://127.0.0.1:8000/queue/create/", data)
      .then((res) => res.data)
      .then((restaurant) => {
        io.in(restaurant.id).emit("update queue");
      })
      .catch((err) => console.error(err));
  });
});

http.listen(3000, function () {
  console.log("Listening on port 3000");
});
