import 'mocha';

import axios from 'axios';
import chai, {assert, expect} from 'chai';
import ProxyServer from '../src/server';
import WebSocket from "uws";

describe("ProxyServer",  function() {
    const server = new ProxyServer({
        websocketToken: "ravioli ravioli give me the formuoli",
        whitelist: ["/ravioli"],
        port: 9090
    });

    return server.start().then(() => {
        it("should be online", () => {
            assert(server.open, "Server wasn't open.");
        });

        let socket: WebSocket;

        it("should accept websocket connections", () => {
            socket = new WebSocket(`ws://localhost:${server.conf.port}/subscribe`);

            socket.onerror = (e) => {
                assert(false, "Couldn't connect to server.");
                console.error(e);
            }

            socket.onopen = ({target}) => {
                socket.send(JSON.stringify({token: server.conf.websocketToken}), (e) => {
                    if (e) {
                        assert(false, "Couldn't send message.");
                        console.error(e);
                    }
                });
            }
        });
    });
});