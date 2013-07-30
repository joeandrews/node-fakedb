var assert = require('assert'),
    suite = require('testingey').createSuite('FakeDB Tests'),
    fakedb = require('../lib/fakedb'),
    db = fakedb.init('all-test.db');

suite.spec('Factory method', function () {
  assert.ok(db instanceof fakedb.FakeDB);
});

suite.spec('Add a document', function () {
  
  var num = db.count(),
      key = null;
  
  key = db.add({ name: 'jaydee' });
  assert.ok(num + 1, db.count());
  assert.ok(typeof key == 'string');
  assert.ok(key.length > 0);
});

suite.spec('Get a document', function () {
  
  var key = db.add({ name: 'sheryl' }),
      obj = db.get(key);

  assert.ok(typeof obj == 'object');
  assert.equal(obj.key, key);
  assert.equal(obj.doc.name, 'sheryl');

});

suite.spec('Remove a document', function () {
  
  var key = null,
      obj = null,
      num = 0;
  
  key = db.add({ name: 'addie' });
  num = db.count();
  db.del(key);
  obj = db.get(key);
  assert.ok(num - 1, db.count());
  assert.ok(typeof obj == 'undefined');

});

suite.spec('Get all documents', function () {
  // 2 records from the 2nd nd 3rd tests
  var all = db.all();
  assert.ok(all instanceof Array);
  assert.equal(all.length, 2);
});

suite.spec('Index requirements', function () {
  assert.throws(function () {
    db.all({ where: { name: 'addie' } });
  }, /is not searchable/);
});

suite.spec('Query for documents', function () {
  // setup index
  db.key('name');
  // doc from 3rd test
  var obj = db.all({ where: { name: 'sheryl' } });
  assert.ok(obj instanceof Array);
  assert.equal(obj.length, 1);
  assert.equal(obj[0].doc.name, 'sheryl');
});

suite.spec('Delete all documents', function () {
  db.purge();
  assert.equal(db.count(), 0);
});

suite.run();
