/* Custom Hash module
 * This works similar to the native JS object arrays
 * allows get and set controls for key: value pairs.
 */

function Hash(obj) {

  this.length = 0;
  this.items = {};


  this.set = function(key, value) {
    var previous = undefined;
    if (this.keyExists(key)) {
      previous = this.items[key];
    }
    else {
      this.length++;
    }
    this.items[key] = value;
    return previous;
  }

  this.get = function(key) {
    if(arguments.length === 0) {
      return JSON.stringify(this.items);
    }
    else {
      if(this.keyExists(key)) {
        return this.items[key];
      }
      else {
        return "error: key data not found (key:" + key + ")";
      }
    }
  }

  this.keyExists = function(key) {
    return this.items.hasOwnProperty(key);
  }

  this.clone = function() {
    var cloneHash = (JSON.parse(JSON.stringify(this.items)));
    return cloneHash;
  }
}

module.exports = Hash;
