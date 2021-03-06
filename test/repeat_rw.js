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

var testRW = require('../test_rw');
var test = require('tape');

var atoms = require('../atoms');
var RepeatRW = require('../repeat');

var LengthResult = require('../base').LengthResult;
var WriteResult = require('../base').WriteResult;
var ReadResult = require('../base').ReadResult;
var brokenRW = {
    byteLength: function() {
        return LengthResult(new Error('boom'));
    },
    writeInto: function(val, buffer, offset) {
        return WriteResult(new Error('bang'), offset);
    },
    readFrom: function(buffer, offset) {
        return ReadResult(new Error('bork'), offset);
    },
};

// n:1 (x<Int8>){n}
var tinyIntList = RepeatRW(atoms.UInt8, atoms.Int8);
test('RepeatRW: tinyIntList', testRW.cases(tinyIntList, [
    [[], [0x00]],
    [[-1, 0, 1], [0x03,
                  0xff,
                  0x00,
                  0x01]]
]));

// n:2 (x<Int16BE>){n}
var shortIntList = RepeatRW(atoms.UInt16BE, atoms.Int16BE);
test('RepeatRW: shortIntList', testRW.cases(shortIntList, [
    [[], [0x00, 0x00]],
    [[-1, 0, 1], [0x00, 0x03,
                  0xff, 0xff,
                  0x00, 0x00,
                  0x00, 0x01]],

    // invalid arguments through length/write
    {
        lengthTest: {
            value: 42,
            error: {
                type: 'invalid-argument',
                message: 'invalid argument, not an array',
                argType: 'number',
                argConstructor: 'Number'
            }
        },
        writeTest: {
            value: 42,
            error: {
                type: 'invalid-argument',
                message: 'invalid argument, not an array',
                argType: 'number',
                argConstructor: 'Number'
            }
        }
    }

]));

test('RepeatRW: passes countrw error thru', testRW.cases(RepeatRW(brokenRW, atoms.Int8), [
    {
        lengthTest: {
            value: [],
            error: {message: 'boom'}
        },
        writeTest: {
            value: [],
            length: 1,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [0],
            error: {message: 'bork'}
        }
    }
]));

test('RepeatRW: passes partrw error thru', testRW.cases(RepeatRW(atoms.UInt8, brokenRW), [
    {
        lengthTest: {
            value: [1],
            error: {message: 'boom'}
        },
        writeTest: {
            value: [1],
            length: 1,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [1, 1],
            error: {message: 'bork'}
        }
    }
]));
