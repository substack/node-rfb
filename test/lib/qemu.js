var assert = require('assert');
var path = require('path');
var spawn = require('child_process').spawn;

var img = __dirname + '/../data/linux-0.2.img';
assert.ok(
    fs.existsSync(img),
    '\n\nImage not found. Fetch it:\n\n'
    + '    wget http://wiki.qemu.org/download/linux-0.2.img.bz2'
    + ' -O ' + img + '\n\n'
);

var foundQemu = false;
var which = spawn('which', [ 'qemu' ]);

which.stdout.on('data', function () {
    foundQemu = true;
});

which.on('exit', function () {
    assert.ok(foundQemu, 'qemu required to run this test');
});

var exports = module.exports = function (opts) {
    return spawn('qemu', [
        exports.img, '-monitor', 'stdio', '-snapshot',
        '-vnc',
            ':' + ((opts.port || 5900) - 5900)
            + (opts.password ? ',password' : '')
        ,
    ]);
};

exports.img = img;
