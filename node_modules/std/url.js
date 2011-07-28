var Class = require('./Class')

var URL = Class(function() {

  this._extractionRegex = new RegExp([
    '^', // start at the beginning of the string
    '((\\w+:)?//)?', // match a possible protocol, like http://, ftp://, or // for a relative url
    '(\\w[\\w\\.]+)?', // match a possible domain
    '(\\/[^\\?#]+)?', // match a possible path
    '(\\?[^#]+)?', // match possible GET parameters
    '(#.*)?' // match the rest of the URL as the hash
  ].join(''), 'i')
  
  this.init = function(url) {
    var match = (url || '').toString().match(this._extractionRegex) || []
    this.protocol = match[2] || ''
    this.host = match[3] || ''
    this.pathname = match[4] || ''
    this.search = (match[5]||'').substr(1)
    this.hash = (match[6]||'').substr(1)
  }
  
  this.toString = function() {
    return [
      this.protocol,
      this.host ? '//' + this.host : '',
      this.pathname,
      this.search ? '?' + this.search : '',
      this.hash ? '#' + this.hash : ''
    ].join('')
  }
  
  this.toJSON = this.toString
  
  this.getTopLevelDomain = function() {
    if (!this.host) { return '' }
    var parts = this.host.split('.')
		return parts.slice(parts.length - 2).join('.')
  }
  
})

module.exports = function url(url) { return new URL(url) }
