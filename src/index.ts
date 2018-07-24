import crypto from "crypto";
import fs from "fs";
import path from "path";
import ProxyServer from "./server";
import config from "./config";

const server = new ProxyServer(config);

server.start().then(() => {
    console.log("Started.");
});