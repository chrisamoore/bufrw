// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var TypedError = require('error/typed');

var ShortReadError = TypedError({
    type: 'short-read',
    message: 'short read, {remaining} byte left over after consuming {offset}',
    remaining: null,
    buffer: null,
    offset: null
});

var ShortWriteError = TypedError({
    type: 'short-write',
    message: 'short write, {remaining} byte left over after writing {offset}',
    remaining: null,
    buffer: null,
    offset: null
});

var emptyBuffer = Buffer(0);

function fromBuffer(struct, buffer, offset) {
    var tup = fromBufferTuple(struct, buffer, offset);
    var err = tup[0];
    var value = tup[1];
    if (err) throw err;
    else return value;
}

function byteLength(struct, value) {
    var tup = byteLengthTuple(struct, value);
    var err = tup[0];
    var length = tup[1];
    if (err) throw err;
    else return length;
}

function toBuffer(struct, value) {
    var tup = toBufferTuple(struct, value);
    var err = tup[0];
    var buffer = tup[1];
    if (err) throw err;
    else return buffer;
}

function intoBuffer(struct, buffer, value) {
    var tup = intoBufferTuple(struct, buffer, value);
    var err = tup[0];
    buffer = tup[1];
    if (err) throw err;
    else return buffer;
}

function fromBufferTuple(struct, buffer, offset) {
    offset = offset || 0;
    var res = struct.readFrom(buffer, offset);
    offset = res.offset;
    var err = res.err;
    if (!err && offset !== buffer.length) {
        err = ShortReadError({
            remaining: buffer.length - offset,
            buffer: buffer,
            offset: offset
        });
    }
    if (err) {
        if (err.offset === undefined) err.offset = offset;
        if (err.buffer === undefined) err.buffer = buffer;
    }
    return [err, res.value];
}

function byteLengthTuple(struct, value) {
    var lenRes = struct.byteLength(value);
    if (lenRes.err) return [lenRes.err, 0];
    else return [null, lenRes.length];
}

function toBufferTuple(struct, value) {
    var lenRes = struct.byteLength(value);
    if (lenRes.err) return [lenRes.err, emptyBuffer];
    var length = lenRes.length;
    var buffer = new Buffer(length);
    // buffer.fill(0); TODO option
    return intoBufferTuple(struct, buffer, value);
}

function intoBufferTuple(struct, buffer, value) {
    var writeRes = struct.writeInto(value, buffer, 0);
    if (writeRes.err) return [writeRes.err, buffer];
    var offset = writeRes.offset;
    if (offset !== buffer.length) {
        return [ShortWriteError({
            remaining: buffer.length - offset,
            buffer: buffer,
            offset: offset
        }), buffer];
    }
    return [null, buffer];
}

module.exports.fromBuffer = fromBuffer;
module.exports.byteLength = byteLength;
module.exports.toBuffer = toBuffer;
module.exports.intoBuffer = intoBuffer;
module.exports.fromBufferTuple = fromBufferTuple;
module.exports.byteLengthTuple = byteLengthTuple;
module.exports.toBufferTuple = toBufferTuple;
module.exports.intoBufferTuple = intoBufferTuple;
