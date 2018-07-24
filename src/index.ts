import crypto from "crypto";
import fs from "fs";
import path from "path";
import ProxyServer, { Configuration } from "./server";

const defaultConfig: Configuration = {
    websocketToken: crypto.randomBytes(32).toString("hex"),
    port: 9090,
    whitelist: ["/twitter"]
}

const configPath = path.resolve(__dirname, "config.json");

let exists: boolean;

try {
    exists = fs.statSync(configPath).isFile()
} catch (e) {
    exists = false;
}

if (!exists) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
    console.log("Configuration has been regenerated.");
    console.log(JSON.stringify(defaultConfig, undefined, 4));
}

const config = require(configPath);

const server = new ProxyServer(config);

server.start().then(() => {
    console.log("Started.");
});