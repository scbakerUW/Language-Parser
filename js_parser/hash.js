function Hash(obj) {

  this.length = 0;
  this.items = {};


  this.set = function(key, value) {
    var previous = undefined;
    if (this.keyExists(key)) {
      previous = this.items[key];
      //console.log("key already exists");
    }
    else {
      //console.log("key is new");
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
      //console.log("get(key,host)" + key + ":" + host);
      if(this.keyExists(key)) {
        //cloneHash = new Hash();
        return JSON.stringify(this.items[key]);
        //console.log(cloneHash);
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
