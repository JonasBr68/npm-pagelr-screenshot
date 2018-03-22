/* eslint-disable no-console*/




const pagelr = require("./index");

const fs = require("fs");

const { CaptureRequest } = pagelr("https://api.pagelr.com", "GyXp1IAryECGuWJuoFrxDA");

const req = new CaptureRequest("www.google.com");


const filename = "TestCapture.jpg";

console.log(req.url);

const stream = fs.createWriteStream(filename);
req.downloadScreenShotImage(stream);

req.requestScreenshot().then((url) => {
    console.log(url);
}).catch((error) => {
    console.log(error);
});


const stream2 = fs.createWriteStream(filename);
const screenShotPromise = req.getScreenshotImage(stream2);
screenShotPromise.then((stream) => {
    console.log(stream);
}).catch((error) => {
    console.log(error);
});


// const screenShotHeadRequest = req.makeScreenshot();
// screenShotPromise.then((buffer) => {
//     fs.writeFileSync(filename, buffer);
// }).catch((error) => {
//     console.log(error);
// });


// const getContent = function (options) {
//     // return new pending promise
//     return new Promise((resolve, reject) => {
//         // select http or https module, depending on reqested url
//         //const lib = url.startsWith("https") ? require("https") : require("http");
//         const lib = require("https");
//         const request = lib.get(options, (response) => {
//             // handle http errors
//             if (response.statusCode < 200 || response.statusCode > 299) {
//                 reject(new Error("Failed to load url, status code: " + response.statusCode));
//             }
//             else {
//                 //response.setEncoding("binary");

//                 var buffers = []; // List of Buffer objects
//                 // on every content chunk, push it to the data array
//                 response.on("data", (chunk) => {
//                     buffers.push(chunk);
//                 });
//                 // we are done, resolve promise with those joined chunks
//                 response.on("end", () => {
//                     buffers = Buffer.concat(buffers); // Make one large Buffer of it
//                     resolve(buffers);
//                 });
//             }
//         });
//         // handle connection errors of the request
//         request.on("error", (err) => {
//             reject(err);
//         });
//     });
// };

// var options = {
//     host: req._service.serviceHost ,
//     port: req._service.servicePort,
//     path: req.urlPath,
//     method: req.verb,
//     //encoding: null,
// };


