/**
 * fakedb
 * Copyright(c) 2011 Jesus A. Domingo <jesus.domingo@gmail.com>
 * MIT Licensed
 */

/**
 * Dependencies
 */
const fs = require('fs'),
      sys = require('sys'),
      crypto = require('crypto'),
      events = require('events'),
      index = require('indexer');

/**
 * Constants
 */
const WRITE_LIMIT = 100;

/**
 * Creates a FakeDB instance
 * @param {String} path to the db file to load/create
 * @return {Object} FakeDB instance
 * @api public
 */
function FakeDB(path) {
  
  var self = this;

  this._hash = {};
  this._next = 0;
  this._logs = [];
  this._index = {};

  this._saving = false;

  this._out = fs.createWriteStream(path, {
    flags: 'a+',
    encoding: 'utf-8',
    mode: 0666
  });

  this._load(path);

}

/**
 * Inherit first from EventEmitter before
 * we assign stuff to prototype, or else we
 * lose our assignments
 */
sys.inherits(FakeDB, events.EventEmitter);


/**
 * Add a document to the db
 * @param {Object} document to store
 * @param {Function} optional callback for asynch mode
 * @return {String} key for the document
 * @api public
 */
FakeDB.prototype.add = function (doc, cb) {

  var key = '_' + crypto.createHash('sha1').update('' + (this._next++)).digest('hex'),
      doc = { key: key, doc: doc };
  
  this._hash[key] = doc;
  this._addToIndex(doc.doc, key);
  this._addToLogs(doc);

  if (typeof cb == 'function') {
    process.nextTick(function () {
      cb.call(undefined, key);
    });
    return;
  }

  return key;
};

/**
 * Replace a document referenced by key
 * @param {String} key for the doc to update
 * @param {Object} new document to map against key
 * @api public
 */
FakeDB.prototype.set = function (key, doc) {
  
  if (key in this._hash) {
    
    var doc = { key: key, doc: doc };
    
    this._delFromIndex(key);
    this._hash[key] = doc;
    this._addToIndex(doc.doc, key);
    this._addToLogs(doc);
  }

};

/**
 * Retrieve the doc referenced by key
 * @param {String} doc key
 * @param {Function} optional callback for asynch mode
 * @return {Object} document referenced by key
 * @api public
 */
FakeDB.prototype.get = function (key, cb) {
  
  var obj = this._hash[key];
  
  if (typeof cb == 'function') {
    process.nextTick(function () {
      cb.call(undefined, obj);
    });
    return;
  }
  
  return obj;
};

/**
 * Removes the document referenced by key from the db
 * @param {String} key for the doc to remove
 * @api public
 */
FakeDB.prototype.del = function (key) {
  if (key in this._hash) {
    this._delFromIndex(key);
    delete this._hash[key];
    this._addToLogs({ key: key, doc: null });
  }
};

/**
 * Removes all records from the database
 * @api public
 */
FakeDB.prototype.purge = function () {
  for (var key in this._hash) {
    this._delFromIndex(key);
    delete this._hash[key];
    this._addToLogs({ key: key, doc: null });
  }
};

/**
 * Returns all documents stored in the DB
 * @param {Object|Function} either a hash or a filter function
 * @param {Function} optional callback for asynch mode
 * @return {Array} array of documents
 * @api public
 */
FakeDB.prototype.all = function (q, cb) {
  
  var self = this,
      matches = [],
      records = [],
      uniques = {};

  var limit = 0,
      offset = 0;

  var filter = function (hash, cb) {
    var results = [];
    for (var key in hash) {
      if (cb.call(undefined, hash[key])) {
        results.push(hash[key]);
      }
    }
    return results;
  };

  var everything = function (hash) {
    var results = [];
    for (var key in hash) {
      results.push(hash[key]);
    }
    return results;
  };

  // TODO: refactor this big lump of mess

  if (typeof q == 'object') {

    if (typeof q.where == 'object') {
      
      for (var property in q.where) {
        if (property in this._index) {
          matches = matches.concat(this._index[property].search(q.where[property]));
        } else {
          throw new Error('Property [' + property + '] is not searchable');
        }
      }

      matches.forEach(function (key) {
        if (key in uniques === false) {
          uniques[key] = 1;
          records.push(self._hash[key]);
        }
      });
    
    } else if (typeof q.where == 'function') {
      records = filter(this._hash, q.where);
    } else {
      records = everything(this._hash);
    }

    limit = (typeof q.limit == 'number' ? q.limit : 0);
    offset = (typeof q.offset == 'number' ? q.offset : 0);

  } else if (typeof q == 'function') {
    records = filter(this._hash, q);
  } else {
    records = everything(this._hash);
  }

  if (limit || offset) {
    records = records.slice(offset, limit);
  }

  if (typeof cb == 'function') {
    process.nextTick(function () {
      cb.call(undefined, records);
    });
    return;
  }

  return records;
};

/**
 * Returns the number of records in the database
 * @return {Number} number of records
 * @api public
 */
FakeDB.prototype.count = function () {
  return Object.keys(this._hash).length;
};

/**
 * Adds a searchable index on a document property
 * @param {String} property to index
 * @api public
 */
FakeDB.prototype.key = function (property, numeric) {
  
  numeric = !!numeric || false;

  var indexProperties = { name: property };

  if (!!numeric) {
    indexProperties.type = 'numeric';
  } else {
    indexProperties.length = 50;
  }
  
  if (property in this._index === false) {
    this._index[property] = index.create(indexProperties);
  }

  for (var key in this._hash) {
    if (property in this._hash[key].doc) {
      this._index[property].add(this._hash[key].doc[property], key);
    }
  }
};

/**
 * Updates the indices with the new document
 * @param {Object} document to index
 * @param {String} key for the document
 * @api private
 */
FakeDB.prototype._addToIndex = function (doc, key) {
  for (var property in this._index) {
    if (property in doc) {
      this._index[property].add(doc[property], key);
    }
  }
};

/**
 * Removes a key from the indices
 * @param {String} document key to remove
 * @api private
 */
FakeDB.prototype._delFromIndex = function (key) {
  if (key in this._hash) {
    var obj = this._hash[key];
    for (var property in this._index) {
      if (property in obj.doc) {
        this._index[property].removeKey(key);
      }
    }
  }
};

/**
 * Loads the records and indices from the db file
 * @api private
 */
FakeDB.prototype._load = function (path) {

  var self = this,
      rstr = null,
      buff = '',
      lnum = 0;

  rstr = fs.createReadStream(path, { flags: 'r', encoding: 'utf-8', mode: 0666 });

  rstr.on('data', function (chunk) {

    var rows = (buff + chunk).split('\n');
    
    buff = rows.pop();
    
    rows.forEach(function (row) {
      if (!row.length) {
        return;
      }
      try {
        row = JSON.parse(row);
        if ('key' in row == false) {
          throw new Error('Corrupt record on line #' + lnum);
        }
        if (row.doc !== null) {
          self._hash[row.key] = row;
          ++self._next;
          row = null;
        } else {
          delete self._hash[row.key];
        }
        ++lnum;
      } catch (err) {
        self.emit('error', err);
      }
    });

  });

  rstr.on('end', function () {
    self.emit('load');
  });
  
  rstr.on('error', function (err) {
    if (err.code === 'ENOENT') {
      self.emit('load');
    } else {
      self.emit('error', err);
    }
  });
};

/**
 * Saves the contents of the _logs into the db file
 * @api private
 */
FakeDB.prototype._save = function () {

  var self = this,
      data = null;

  if (self._saving) {
    return;
  }

  self._saving = true;

  var write_count = 0;

  while ((data = self._logs.shift()) && (write_count < WRITE_LIMIT)) {
    self._out.write(JSON.stringify(data) + '\n', function (err) {
      if (err) {
        self.emit('error', err);
        return;
      }
    });
    ++write_count;
  }

  if (self._logs.length) {
    process.nextTick(function () {
      self._save();
    });
  }

  self._saving = false;

};

/**
 * Adds an operation to the logs
 * @param {Object} operation to log
 * @api private
 */
FakeDB.prototype._addToLogs = function (op) {
  var self = this;
  self._logs.push(op);
  process.nextTick(function () {
    self._save();
  });
};

/**
 * Export the class
 */
exports.FakeDB = FakeDB;

/**
 * Factory method
 */
exports.init = function (path) {
  return new FakeDB(path);
};
