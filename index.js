// rfb client module
// http://www.realvnc.com/docs/rfbproto.pdf

var EventEmitter = require('events').EventEmitter;
var net = require('net');
var Put = require('put');

var Parser = require('./lib/parser');
var constants = require('./lib/constants');

module.exports = function (opts) {
    var self = new EventEmitter;
    if (!opts) opts = {};
    
    var host = opts.host || 'localhost';
    var port = opts.port || 5900;
    
    self.shared = opts.shared || false;
    self.engine = opts.engine || 'qemu';
    self.securityType = opts.securityType || 'none';
    self.password = opts.password || '';
    
    // buffer up requests for the size until it's available
    var size = null;
    var dimQueue = []; // store callbacks
    
    self.__defineGetter__('dimensions', function () {
        return function (f) {
            if (size == null) dimQueue.push(f)
            else f(size);
        }
    });
    
    self.__defineSetter__('dimensions', function (dims) {
        var s = { width : dims.width, height : dims.height };
        if (size == null) dimQueue.forEach(function (f) { f(s) });
        size = s;
    });
    
    var stream = self.stream = net.createConnection(port, host);
    
    stream.setNoDelay();
    
    stream.on('error', function (err) {
        self.emit('error', err);
    });
    
    stream.on('end', function () {
        self.emit('end');
        self.write = function (buf) {
            console.warn("Didn't write bytes to closed stream");
        };
    });
    
    var parser = new Parser(self, opts);
    
    self.write = function (buf) {
        if (Buffer.isBuffer(buf)) {
            stream.write(buf);
        }
        else {
            stream.write(buf, 'binary');
        }
        return self;
    };
    
    self.send = self.write.bind(self); // deprecated
    
    self.end = function () {
        stream.end();
        return self;
    };
    
    self.sendKey = function (key, down) {
        Put()
            .word8(constants.clientMsgTypes.keyEvent)
            .word8(!!down)
            .pad(2)
            .word32be(key)
            .write(self)
        ;
        return self;
    };
    
    self.sendKeyDown = function (key) {
        return self.sendKey(key, 1);
    };
    
    self.sendKeyUp = function (key) {
        return self.sendKey(key, 0);
    };
    
    self.sendPointer = function (x, y, mask) {
        Put()
            .word8(constants.clientMsgTypes.pointerEvent)
            .word8(mask)
            .word16be(x)
            .word16be(y)
            .write(self)
        ;
        return self;
    };
    
    self.requestUpdate = function (params) {
        Put()
            .word8(constants.clientMsgTypes.fbUpdate)
            .word8(params.subscribe)
            .word16be(params.x)
            .word16be(params.y)
            .word16be(params.width)
            .word16be(params.height)
            .write(self)
        ;
    };
     
    self.requestRedraw = function () {
        self.dimensions(function (dims) {
            self.requestUpdate({
                x : 0,
                y : 0,
                width : dims.width,
                height : dims.height,
                subscribe : 0,
            });
        });
    };
    
    self.subscribe = function (params) {
        self.requestUpdate({
            x : params.x,
            y : params.y,
            width : params.width,
            height: params.height,
            subscribe : 1,
        });
    };

    self.copyText = function (text) {
        var l = text.length;

        var p = Put()
            .word8(constants.clientMsgTypes.cutText)
            .pad(3)
            .word32be(l);

        for (var i = 0; i < l; ++i) {
            p.word8( text.charCodeAt(i) );
        }

        p.write(self);
    };
    
    return self;
};
