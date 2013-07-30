# FakeDB

FakeDB is a document storage module suitable for small projects. It supports basic querying of records
and supports both synchronous and asynchronous modes of access.

## Installation

```
npm install fakedb
```

## Example Code

``` js
var db = require('fakedb').init('example.db');

// add a document (synchronous)
var key = db.add({ username: 'jaydee', type: 'user' });
console.log('Document added with key ' + key);

// or asynchronously
db.add({ username: 'sheryl', type: 'user' }, function (key) {
  console.log('Document added with key ' + key);
});

// to search the db using queries, index
// the fields you want to query first
db.key('username');
db.key('type');

// search for a document using key-value pairs
var users = db.all({ where: { type: 'user' } });

// or using a filtering function
var one = db.all(function (obj) { return obj.doc.username == 'jaydee'; });

// or just get everything
var all = db.all();

// db.all(), db.get() both work asynchronously
db.get(key, function (obj) {
  console.log('Hello there from ' + obj.doc.username + '!');
});

// delete a record
db.del(key);

// or purge the database
db.purge();
```

## Testing

A simple test script is provided in the test folder. To run this script, `node-testingey` needs to be installed.

```
npm install testingey
```

## License

(The MIT License)

Copyright (c) 2011 Jesus A. Domingo <jesus.domingo@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
