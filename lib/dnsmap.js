/**
 * Map DNS records for a given target
 * @param {String} target
 * @param {Array} wordlist
 * @param {Object} [options]
 * @param {Function} callback
 * @return {dnsmap.Stream}
 */
function dnsmap( target, wordlist, options, callback ) {

  if( typeof options === 'function' ) {
    callback = options
    options = {}
  }

  options = options || {}
  options.target = target

  var results = []

  var stream = dnsmap.searchStream( options )
    .once( 'error', callback )
    .once( 'end', function() {
      callback( null, results )
    })
    .on( 'readable', function() {
      var data = null
      while( data = this.read() )
        results.push( data )
    })

  for( var i = 0; i < wordlist.length; i++ ) {
    stream.write( wordlist[i] )
  }

  return stream

}

dnsmap.SearchStream = require( './search-stream' )

dnsmap.createStream =
dnsmap.searchStream = function( options ) {
  return new dnsmap.SearchStream( options )
}

module.exports = dnsmap
