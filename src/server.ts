import bodyParser from "body-parser";
import crypto from "crypto";
import express from "express";
import uws from "uws";
import { RequestHandler, Request } from "../node_modules/@types/express-serve-static-core";
import { Server } from "http";
import { resolve } from "dns";
import Configuration from "./config";

const server = express();
require('express-uws')(server);

declare module "express-serve-static-core" {
    interface _WebSocket extends WebSocket {
        on(event: "message", data: string | Buffer | ArrayBuffer | Buffer[]);
        on(event: "error", data: Error);
        on(event: "close", cb: () => any);
        on(event: string, cb: any);
    }

    interface IRouter extends RequestHandler {
        ws: (event: string, cb: (ws: _WebSocket, req: Request) => any) => this;
    }
}

/**
 * Creates a HMAC SHA-256 hash created from the app TOKEN and
 * your app Consumer Secret.
 * @param  token  the token provided by the incoming GET request
 * @return string
 */
function createChallengeResponse(crc_token: string, consumer_secret: string) {
  return crypto.createHmac('sha256', consumer_secret).update(crc_token).digest('base64');
}

export default class ProxyServer {
    private server: express.Express;
    private baseServer: Server;
    private sockets: WebSocket[];

    public constructor() {
    }

    public start(): Promise<void> {
        if (this.open) return this.stop().then(() => this.start());

        return new Promise((resolve, reject) => {
            this.sockets = [];
            this.server = express();
            // add uws to app
            require('express-uws')(server);
            
            // uws listener
            server.ws('/subscribe', (ws, req) => {
                console.log("Connected.");
                ws.on("message", msg => {
                    // don't add duplicate sockets
                    if (this.sockets.includes(ws)) return;
                    try {
                        // token validation
                        const {token} = JSON.parse(msg.toString());
                        if (token !== Configuration.websocketToken) {
                            console.log("Blocked.");
                            return ws.close();
                        }
                        ws.send(JSON.stringify({authenticated: true}));
                        console.log("Authenticated.");
                        this.sockets.push(ws);
                    } catch (e) {
                        // close if invalid payload :(
                        ws.close();
                    }
                });
            });
            
            // json body parsing
            server.use(bodyParser.json());
            
            // checks that this is a whitelisted proxy url
            server.use((req, res, next) => {
                if (!Configuration.whitelist.includes(req.path)) {
                    console.log("Forbidden.");
                    return res.status(401).end();
                }
                next();
            });

            // twitter crc_token
            server.use((req, res, next) => {
                if (req.query.crc_token) {
                    const hash = createChallengeResponse(req.query.crc_token, Configuration.twitterSecret || "invalid :(");

                    return res.status(200).json({response_token: 'sha_256=' + hash});
                }
                return next();
            });
            
            // the mgaic!
            server.all("*", ({path, body}, res, next) => {
                res.end();

                const dispatch = JSON.stringify({
                    path,
                    body
                });

                console.log("Dispatching.");
            
                for (let socket of this.sockets) {
                    socket.send(dispatch);
                }
            });

            this.baseServer = server.listen(Configuration.port, resolve);
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.baseServer.close(() => {
                delete this.baseServer;
                delete this.server;
                delete this.sockets;
                resolve();
            });
        });
    }

    public get open(): boolean {
        return this.baseServer && this.baseServer.listening;
    }
}
