var dnsmap = require( '..' )
var fs = require( 'fs' )
var util = require( 'util' )

var wordlistPath = __dirname + '/../test/data/public-suffix.txt'
var suffixes = fs.readFileSync( wordlistPath, 'utf8' ).trim()

var log = console.log.bind( console )

function inspect( value ) {
  return util.inspect( value, inspect.options )
}

inspect.options = {
  depth: null,
  colors: true,
}

var target = process.argv.slice(2).shift() || 'example'
var mapper = dnsmap.searchStream({
  pattern: target + '.%s',
})

mapper.on( 'readable', function() {
  var data = null
  while( data = this.read() ) {
    log( inspect( data ) )
    log()
  }
})

mapper.on( 'dns:query', function( domain ) {
  console.log( domain )
})

mapper.once( 'end', function() {
  log( inspect( this.stats ) )
})

suffixes.split( /\r?\n/g ).sort( function() {
  return Math.random() * 2 - 1
}).forEach( function( word ) {
  mapper.write( word )
})

mapper.end()
