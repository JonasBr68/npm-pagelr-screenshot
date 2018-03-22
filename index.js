/* eslint-disable no-console, no-unused-vars*/
//Generate documenation with
//> jsdoc procedural_api.js -c jsdoc.json

function encodeURIComponentRFC3986(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

class BaseService {
    constructor(apiUri, apiKey, apiSecret) {
        if (apiUri.startsWith("http")) {
            const parts = apiUri.split("://");
            this._protocol = parts[0];
            const noProtocol = parts.slice(1);
            if (noProtocol.length != 1)
                throw new Error("bad apiUri " + apiUri);
            apiUri = noProtocol[0];
        }
        this._serviceHost = apiUri || "api.pagelr.com"; // "https://api.pagelr.com/capture";
        this._hostPort = this._protocol ? (this._protocol.toLowerCase() == "http" ? 80 : 443) : 443;
        this._apiKey = apiKey;
        this._apiSecret = apiSecret;
        this._protocol = this._protocol || "https";
    }
    get serviceHost() {
        return this._serviceHost;
    }
    get servicePort() {
        return this._hostPort;
    }
    get protocol() {
        return this._protocol;
    }
}

const VERB = {
    GET: "GET",
    HEAD: "HEAD",
};

function uriHandler(value) {
    return encodeURIComponentRFC3986(value);
}
function bwidthHandler(value) {
    return value;
}
function widthHandler(value) {
    return value;
}
function heightHandler(value) {
    return value;
}
function apicallHandler(value) {
    return value || 1;
}
function delayHandler(value) {
    return value;
}
function maxageHandler(value) {
    return value;
}
function retinaHandler(value) {
    return value;
}
function formatHandler(value) {
    if (value in FORMAT_VALUES)
        return value;
    else
        throw new Error("Bad format value, format=" + value + " is not valid\n" +
            "Valid values are " + FORMAT_VALUES.png.name + " and " + FORMAT_VALUES.jpg.name);
}
function adsHandler(value) {
    return value;
}
function cookiesHandler(value) {
    return value;
}
function keyHandler(value) {
    return value;
}

const PARAM = {
    uri: "uri",
    b_width: "b_width",
    width: "width",
    height: "height",
    apicall: "apicall",
    delay: "delay",
    maxage: "maxage",
    retina: "retina",
    format: "format",
    ads: "ads",
    cookies: "cookies",
    key: "key"
};

const FORMAT_VALUES = {
    "png": { name: "png", mime: "image/png" },
    "jpg": { name: "jpg", mime: "image/jpeg" },
};

const ParamHandlers = {
    [PARAM.uri]: uriHandler,
    [PARAM.b_width]: bwidthHandler,
    [PARAM.width]: widthHandler,
    [PARAM.height]: heightHandler,
    [PARAM.apicall]: apicallHandler,
    [PARAM.delay]: delayHandler,
    [PARAM.maxage]: maxageHandler,
    [PARAM.retina]: retinaHandler,
    [PARAM.format]: formatHandler,
    [PARAM.ads]: adsHandler,
    [PARAM.cookies]: cookiesHandler,
    [PARAM.key]: keyHandler
};

class RequestBase {
    constructor(uri) {
        this._params = new Map();
        this._service = CaptureRequest._service;
        this._basePath = "/capture";
        //Set up defaults
        if (this._service._apiKey)
            this.setParam("key", this._service._apiKey);

        this.setParam("uri", uri);

        this.setParam("width", 1024);
        this.setParam("height", Math.round(1024 * 3 / 4));

        this.setParam("apicall", 1);

    }
    refreshParams() {
        for (let p in ParamHandlers) {
            if (this[p]) {
                const vO = this[p];
                const vP = this.getParam(p, false);
                if (vP && vP != vO) {
                    //getParam has presedence, set object property to reflect
                    this[p] = vP;
                }
                else
                    this.setParam(p, this[p], false);
            }
        }
    }
    get mimeType() {
        const format = this.getParam(PARAM.format);
        if (format in FORMAT_VALUES)
            return FORMAT_VALUES[format].mime;
        else
            return FORMAT_VALUES.png.mime; //Default
    }
    getParam(key, refresh = true) {
        if (refresh)
            this.refreshParams();
        return this._params.get(key);
    }
    setParam(key, value, refresh = true) {
        if (refresh)
            this.refreshParams();
        key = key.toLowerCase();
        if (key == "delay" && !this._useJavaScript)
            throw new Error("delay parameter is not allowed without enabling javascript for the request");

        if (!(key in ParamHandlers))
            throw new Error("Unknown parameter " + key);

        const vettedValue = ParamHandlers[key](value);
        this._params.set(key, vettedValue);
        return this;
    }
}

class CaptureRequest extends RequestBase {
    constructor(uri, useJavaScript = false, verb = VERB.GET) {

        if (arguments.length == 0)
            throw "CaptureRequest(uri), uri is required parameter";

        super(uri);

        this._useJavaScript = useJavaScript;
        this._verb = verb;
    }

    /**
      * Method to request the screenshot image download as per this CaptureRequest object
      * @example
      * // Promise
      * updatePerson(person, 50, "Jonas Brandel");
      */
    async getScreenshotImage(writeablestream) {
        return await this.doScreenshotRequest(VERB.GET, writeablestream);
    }
    async requestScreenshot() {
        return await this.doScreenshotRequest(VERB.HEAD);
    }
    async doScreenshotRequest(verb, writeablestream) {
        var options = {
            host: this._service.serviceHost,
            port: this._service.servicePort,
            path: this.urlPath,
            method: verb,
            service: this.service,
            request: this,
        };
        // return new pending promise
        return new Promise((resolve, reject) => {
            // select http or https module, depending on service
            const lib = require(options.service.protocol);
            const request = lib.request(options, (response) => {
                const req = options.request;

                // handle http errors

                if (response.statusCode < 200 || response.statusCode > 299) {
                    let error = new Error("Failed to load url, status code: " + response.statusCode);
                    error.statusCode = response.statusCode;
                    reject(error);
                }
                else {
                    if (response.headers["content-type"] != req.mimeType)
                        throw new Error("Requested and recived content-type mismatch " + req.mimeType + " != " + response.headers["content-type"]);
                    if (writeablestream.setHeader && writeablestream.writeHead) {

                        writeablestream.setHeader("x-pglr-url", req.url);
                        for (let h in response.headers) {
                            if (h.startsWith("x-pglr")) //Forward the pagelr headers
                            {
                                writeablestream.setHeader(h, response.headers[h]);
                            }
                        }
                        writeablestream.writeHead(200, { 'Content-Type': req.mimeType });
                    }

                    // on every content chunk, push it to callers stream
                    response.on("data", (chunk) => {
                        if (writeablestream)
                            writeablestream.write(chunk);
                        else
                            throw new Error("No writeablestream");
                    });
                    // we are done, resolve promise with those joined chunks
                    response.on("end", () => {
                        // if (buffers.length > 0) {
                        //     buffers = Buffer.concat(buffers); // Make one large Buffer of it
                        //     resolve(buffers);
                        // }
                        if (writeablestream) {
                            writeablestream.end();
                        }
                        resolve(req.url);
                    });
                    response.on("error", (err) => {
                        reject(err);
                    });
                }
            });
            // handle connection errors of the request
            request.on("error", (err) => {
                reject(err);
            });
            request.end(); //Finish with the request and let it fire
        });

    }
    get apiPath() {
        return this._basePath + (this._useJavaScript ? "/javascript" : "");
    }
    get urlPath() {
        let uriParts = [];
        this.refreshParams();
        for (var [key, value] of this._params) {
            uriParts.push(key + "=" + value);
        }
        return this.apiPath + "?" + uriParts.join("&");
    }
    get url() {
        return this.service.protocol + "://" + this.service.serviceHost + this.urlPath;
    }
    get service() {
        return this._service;
    }
}

// class CaptureGetRequest extends BaseRequest {
//     constructor(url, useJavaScript = false) {
//         super(url, useJavaScript);
//         super._verb = "GET";
//     }
// }

// class CaptureHeadRequest extends BaseRequest {
//     constructor(url, useJavaScript = false) {
//         super(url, useJavaScript);
//         super._verb = "HEAD";
//     }
// }

// class MakeArchivedCaptureRequest extends BaseRequest {
//     constructor(url, useJavaScript = false) {
//         super(url, useJavaScript);
//         super._verb = "GET";
//         super._basePath = "/archive";
//     }
// }



module.exports = function (serviceUri, apiKey, apiSecret) {
    const _service = new BaseService(serviceUri, apiKey, apiSecret);
    CaptureRequest._service = _service;
    return {
        CaptureRequest,
        // CaptureHeadRequest,
        // MakeArchivedCaptureRequest,
    };
};