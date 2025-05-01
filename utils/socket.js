const userMap = new Map(); // Map socket.id to displayName

exports.setupSocket = (io) => {
  io.on("connection", (socket) => {
    // Track user who joined
    socket.on("user-joined", (displayName) => {
      userMap.set(socket.id, displayName);
      io.emit("user-joined", `${displayName} has joined the chat`);
    });

    // Handle chat messages
    socket.on("send-message", ({ displayName, message }) => {
      io.emit("chat-message", { displayName, message });
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      const displayName = userMap.get(socket.id) || "A user";
      io.emit("user-disconnected", `${displayName} has left the chat`);
      userMap.delete(socket.id);
    });
  });
};
