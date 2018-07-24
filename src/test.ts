import WebSocket from "uws";

const {port, websocketToken} = require("./config.json");

const sock = new WebSocket(`ws://localhost:${port}/subscribe`);

sock.onopen = () => {
    console.log("Connected. Authenticating.");
    sock.send(JSON.stringify({token: websocketToken}));
}

sock.onmessage = (msg) => {
    console.log(JSON.parse(msg.data));
}