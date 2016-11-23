var path = require( 'path' )
var fs = require( 'fs' )
var https = require( 'https' )
var readline = require( 'readline' )
var Stream = require( 'stream' )
var url = require( 'url' )
var punycode = require( 'punycode' )

var publicSuffix = path.join( __dirname, '..', 'test', 'data', 'public-suffix.txt' )
var tlds = path.join( __dirname, '..', 'test', 'data', 'tld.txt' )

var options = url.parse( 'https://publicsuffix.org/list/public_suffix_list.dat' )

var transform = new Stream.Transform({
  objectMode: true,
  transform: function( line, encoding, next ) {
    this.suffixes = this.suffixes || 0
    this.tlds = this.tlds || 0
    // Ignore commented lines
    if( /^\s*\/\//.test( line ) )
      return next()
    // A public suffix ends where the first whitespace starts
    var parts = /^[^\s]+/.exec( line )
    var suffix = parts && parts[0]
    if( suffix ) {
      // Remove dot-, cookie- & wildcard-prefix
      suffix = suffix.trim()
      suffix = suffix.replace( /^[\!\*\.]+/, '' )
      // Ignore multi-wildcard prefixes
      if( suffix.indexOf( '*' ) !== -1 )
        return next()
      // If there's no dot in it, this is an actual TLD
      if( !/\./.test( suffix ) ) {
        this.tlds++
        this.emit( 'tld', punycode.toASCII( suffix ) + '\n' )
      }
      this.suffixes++
      this.push( punycode.toASCII( suffix ) + '\n' )
    }
    next()
  },
  flush: function( done ) {
    console.log( 'Loaded', this.tlds, 'TLDs')
    console.log( 'Loaded', this.suffixes - this.tlds, 'public suffixes' )
    console.log( 'Total:', this.suffixes )
  },
})

console.log( '' )
console.log( 'HTTP', 'GET', url.format( options ) )

var req = https.request( options, function( response ) {

  console.log( 'HTTP', response.statusCode, response.statusMessage )
  console.log( '' )

  for( var k in response.headers ) {
    console.log( '  ' + k + ':', response.headers[k] )
  }

  console.log( '' )

  if( response.statusCode !== 200 )
    throw new Error( `HTTP ${response.statusCode} ${response.statusMessage}` )

  var splitter = readline.createInterface({ input: response })
  var tldfile = fs.createWriteStream( tlds )

  splitter.on( 'line', (line) => {
    transform.write( line )
  })

  transform.pipe( fs.createWriteStream( publicSuffix ) )
  transform.on( 'tld', ( tld ) => { tldfile.write( tld ) })

  response.once( 'end', () => {
    splitter.close()
    transform.end()
    tldfile.end()
  })

})

req.end()
