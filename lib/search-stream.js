var dns = require( 'dns' )
var Stream = require( 'stream' )
var inherit = require( 'bloodline' )
var queue = require( 'fastq' )
var parallel = require( 'fastparallel' )()

/**
 * DNS Mapper Search Stream
 * @constructor
 * @param {Object} [options]
 */
function SearchStream( options ) {

  if( !(this instanceof SearchStream) ) {
    return new SearchStream( options )
  }

  Stream.Transform.call( this )

  this._readableState.objectMode = true

  /** @type {String} Domain to scan */
  this.target = null
  /** @type {Number} Maximum number of queries to run in parallel */
  this.concurrency = 1
  /** @type {Number} Maximum delay between DNS lookups */
  this.maxDelay = 100
  /** @type {Array} List of record types to try */
  this.types = SearchStream.RRTYPES.slice()

  Object.assign( this, options )

  this.pattern = this.pattern || '%s.' + this.target
  this.queue = queue( this, this._worker, this.concurrency )

  /** @type {Object<String,Number>} Query stats */
  this.stats = {
    domains: 0,
    queries: 0,
    errors: 0,
    records: 0,
  }

  if( this.target ) {
    this._schedule( this.target )
  }

}

/**
 * DNS record types to query
 * @type {Array}
 */
SearchStream.RRTYPES = [
  'A',
  'AAAA',
  'MX',
  'TXT',
  'SRV',
  'PTR',
  'NS',
  'CNAME',
  'SOA',
  'NAPTR',
]

/**
 * Filter out errored queries
 * @param {Object} query
 * @return {Boolean}
 */
SearchStream.filterErrors = function( query ) {
  return query.error == null
}

/**
 * Check if result is a name collision
 * @see https://icann.org/namecollision
 * @param {Object} result
 * @return {Boolean}
 */
SearchStream.hasCollision = function( result ) {
  var isCollision = Array.isArray( result['A'] ) &&
    result['A'].indexOf( '127.0.53.53' ) === 0
  return isCollision
}

/**
 * Bundle up records per domain
 * @param {Object} result
 * @param {Object} query
 * @return {Object} result
 */
SearchStream.reduceQueries = function( result, query ) {
  result.domain = result.domain || query.domain
  result[ query.rrtype ] = query.records
  return result
}

/**
 * DNS Map prototype
 * @type {Object}
 * @ignore
 */
SearchStream.prototype = {

  /**
   * Create a list of query objects for all RRTYPES
   * as node's `dns.resolve()` does not implement the `ANY` type
   * @param {String} domain
   * @return {Array} queries
   * @internal
   */
  _queries: function( domain ) {
    var queries = []
    for( var i = 0; i < this.types.length; i++ ) {
      queries.push({ domain: domain, rrtype: this.types[i] })
    }
    return queries
  },

  /**
   * Resolve a DNS query
   * @param {Object} query
   * @param {Function} callback
   * @internal
   */
  _resolver: function( query, callback ) {
    this.stats.queries++
    dns.resolve( query.domain, query.rrtype, ( error, records ) => {
      query.records = records
      query.error = error
      if( error ) this.stats.errors++
      if( records ) this.stats.records += records.length || 1
      callback( null, query )
    })
  },

  /**
   * Run a batch of DNS queries against a domain
   * @param {String} domain
   * @param {Function} callback
   * @internal
   */
  _worker: function( domain, callback ) {

    this.emit( 'dns:query', domain )

    if( !this.maxDelay ) {
      parallel( this, this._resolver, this._queries( domain ), callback )
      return
    }

    var delay = Math.round( Math.random() * this.maxDelay )

    setTimeout( () => {
      parallel( this, this._resolver, this._queries( domain ), callback )
    }, delay )

  },

  /**
   * Schedule a batch of queries for a domain
   * @param {String} domain
   * @internal
   */
  _schedule: function( domain ) {

    this.stats.domains++

    this.queue.push( domain, ( error, results ) => {

      if( error ) {
        return this.emit( 'dns:error', error, results )
      }

      results = results.filter( SearchStream.filterErrors )

      if( results.length ) {
        var result = results.reduce( SearchStream.reduceQueries, {})
        SearchStream.hasCollision( result ) ?
          this.emit( 'dns:collision', result ) :
          this.push( result )
      }

    })

  },

  _transform: function( word, encoding, next ) {
    var domain = this.pattern.replace( '%s', word )
    this._schedule( domain )
    next()
  },

  _flush: function( done ) {
    if( this.queue.length() )
      this.queue.drain = done
    else done()
  },

}

inherit( SearchStream, Stream.Transform )

module.exports = SearchStream
