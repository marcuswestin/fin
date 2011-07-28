var Class = require('./Class'),
  bind = require('./bind'),
  invokeWith = require('./invokeWith')

module.exports = Class(function() {
  this.init = function() {
    this.dependants_ = []
    this.fulfillment_ = null
  }
  
  this.add = function(callback) {
    if (this.fulfillment_) { callback.apply(this, this.fulfillment_) }
    else { this.dependants_.push(callback) }
  }
  
  this.fulfill = function(/* arg1, arg2, ...*/) {
    if (this.fulfillment_) { throw new Error('Promise fulfilled twice') }
    this.fulfillment_ = slice(arguments)
    each(this.dependants_, invokeWith.apply(this, this.fulfillment_))
  }
})
