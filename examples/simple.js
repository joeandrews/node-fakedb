var db = require('../lib/fakedb').init('example.db');

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
