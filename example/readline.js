var dnsmap = require( '..' )
var readline = require( 'readline' )
var fs = require( 'fs' )
var util = require( 'util' )

function inspect( value ) {
  return util.inspect( value, {
    depth: null,
    colors: true,
  })
}

var wordlist = readline.createInterface({
  input: fs.createReadStream( __dirname + '/../test/data/wordlist.txt' )
})

var mapper = dnsmap.searchStream({
  target: process.argv.slice(2).shift() || 'example.com'
})

wordlist.on( 'line', function( word ) {
  mapper.write( word )
})

mapper.on( 'dns:query', function( domain ) {
  console.log( domain )
})

mapper.on( 'data', function( data ) {
  console.log()
  console.log( inspect( data ) )
  console.log()
})
