// Thanks Douglas Crockford! http://javascript.crockford.com/prototypal.html
module.exports = function create(obj) {
  if (typeof Object.create == 'function') {
    module.exports = function create(obj) {
      return Object.create(obj)
    }
  } else {
    module.exports = function create(obj) {
      function F() {}
      F.prototype = obj
      return new F()
    }
  }
  return module.exports(obj)
}
