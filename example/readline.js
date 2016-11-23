var dnsmap = require( '..' )
var readline = require( 'readline' )
var fs = require( 'fs' )

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
  console.log( data )
  console.log()
})
