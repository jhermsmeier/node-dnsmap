# dnsmap
[![npm](https://img.shields.io/npm/v/dnsmap.svg?style=flat-square)](https://npmjs.com/package/dnsmap)
[![npm license](https://img.shields.io/npm/l/dnsmap.svg?style=flat-square)](https://npmjs.com/package/dnsmap)
[![npm downloads](https://img.shields.io/npm/dm/dnsmap.svg?style=flat-square)](https://npmjs.com/package/dnsmap)

DNS network mapper

## Install via [npm](https://npmjs.com)

```sh
$ npm install --save dnsmap
```

## Usage

```js
var dnsmap = require( 'dnsmap' )
```

**Options**

```js
var mapper = dnsmap.createStream({
  // Target base domain / string
  target: null,
  // Maximum number of queries to run in parallel
  concurrency: 1,
  // Maximum delay between DNS lookups
  maxDelay: 100,
  // DNS record types to query (defaults to all)
  types: [ 'AAAA' ],
  // Word substitution pattern
  // Defaults to '%s.' + target
  pattern: '%s.domain.tld',
})
```

**Mapping subdomains**

```js
var readline = require( 'readline' )
var fs = require( 'fs' )

var wordlist = readline.createInterface({
  input: fs.createReadStream( __dirname + '/../test/data/wordlist.txt' )
})

var mapper = dnsmap.searchStream({
  target: 'example.com'
})

wordlist.on( 'line', function( word ) {
  mapper.write( word )
})

mapper.on( 'data', function( data ) {
  console.log( data )
  console.log()
})
```

**Mapping TLDs & public suffixes**

```js
var wordlist = readline.createInterface({
  input: fs.createReadStream( __dirname + '/../test/data/public-suffix.txt' )
})

var mapper = dnsmap.searchStream({
  pattern: 'google.%s',
})

wordlist.on( 'line', function( word ) {
  mapper.write( word )
})

mapper.on( 'data', function( data ) {
  console.log( data )
  console.log()
})
```

**Example `data` event result for `google.tel`:**

```js
{
  domain: 'google.tel',
  A: ['194.77.54.2'],
  TXT: [
    ['.tsm',
      '13.1',
      'pddx',
      '1',
      'color1',
      '',
      'color2',
      '',
      'color3',
      '',
      'color4',
      '',
      'css',
      '',
      'pss',
      '',
      'hml',
      '',
      'htl',
      '',
      'gan',
      '',
      'log',
      '',
      'bkg',
      '',
      'bip',
      ''
    ]
  ],
  NS: ['d0.cth.dns.nic.tel',
    'a0.cth.dns.nic.tel',
    'n0.cth.dns.nic.tel',
    's0.cth.dns.nic.tel',
    't0.cth.dns.nic.tel'
  ],
  SOA: {
    nsname: 'd0.cth.dns.nic.tel',
    hostmaster: 'cth-support.support.nic.tel',
    serial: 10,
    refresh: 10800,
    retry: 3600,
    expire: 2592000,
    minttl: 60
  },
  NAPTR: [{
    flags: 'u',
    service: 'E2U+web:http',
    regexp: '!^.*$!http://www.google.com!',
    replacement: '',
    order: 100,
    preference: 100
  }]
}
```

## Examples

You can run the files in the `example` folder,
and also supply a target as an argument (`example(.com)` is used by default):

```sh
# Map out registered TLDs
$ node example/tlds.js google
```
```sh
# Map subdomains from a wordlist
$ node example/readline.js google.com
```
