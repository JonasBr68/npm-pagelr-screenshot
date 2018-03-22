/* eslint-disable no-console, no-unused-vars*/
"use strict";

const { URL: Url } = require('url');
var http = require('http');
let active_requests = 0;

const pagelr = require("./index");
//Staging service http://38492c4070f148e89c6e169f0bf1723c.cloudapp.net/ 
const { CaptureRequest } = pagelr("http://38492c4070f148e89c6e169f0bf1723c.cloudapp.net", "GyXp1IAryECGuWJuoFrxDA");
const JAVASCRIPT = "javascript";
http.createServer(function (request, response) {

    try {


        const url = new Url("http://" + request.headers["host"] + request.url);

        let path_parts = url.pathname.split("/");
        if (path_parts.length > 1 && path_parts[1].toLowerCase() == "capture") {
            active_requests++;
            const useJavascript = path_parts.length > 2 ? (path_parts[2].toLowerCase() == JAVASCRIPT ? true : false) : false;
            let urlStr = path_parts.slice(useJavascript ? 3 : 2).join("/");
            const req = new CaptureRequest(urlStr, useJavascript);
            for (var [name, value] of url.searchParams.entries()) {
                req.setParam(name, value);
            }
            if (useJavascript)
                req.delay = req.delay || 3000;

            const screenShotPromise = req.getScreenshotImage(response);
            screenShotPromise.then((stream) => {
                console.log("Screenshot captured and returned " + req.url);
                active_requests--;
            }).catch((error) => {
                response.writeHead(error.statusCode || 200, { 'Content-Type': 'text/plain' });
                response.write(error.toString());
                response.end();
                active_requests--;
            });
        }
        else {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write("Active PageLr requests = " + active_requests);
            response.end();
        }

    }
    catch (error) {
        response.writeHead(error.statusCode || 500, { 'Content-Type': 'text/plain' });
        response.write(error.toString());
        response.end();
        active_requests--;
    }
}).listen(8080);

console.log('Server started');