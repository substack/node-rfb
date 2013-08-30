## RFB client library for node.js

see: http://www.realvnc.com/docs/rfbproto.pdf

### Usage Example

````js
var rfb = require('rfb')({
  host: 'localhost'
  , port: 5900
  , shared: true
  , securityType: 'vnc' // or 'none'
  , password: 'test'
});
rfb.on('error', function(e){
  throw e;
});
rfb.on('raw', function(rect){
  rect.x
  rect.y
  rect.width
  rect.height
  rect.encodingType
  rect.encodingType
  rect.depth
  rect.fb // contains the actual frame buffer
});

// other methods
rfb.sendPointer(x, y, mask);
rfb.sendKeyUp(key);
rfb.sendKeyDown(key);
rfb.requestUpdate({ ... });
rfb.pointer(x, y, mask);
````