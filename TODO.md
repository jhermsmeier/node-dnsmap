# TODO

- [x] Clean up the code
- [ ] Add an example for recursive mapping
- [x] Write lib usage examples (tld scan, custom wordlist, generative words, ...?)
- [ ] Heuristically (?) determine whether a domain has a wildcard record
      and error if so, as the entire wordlist would otherwise generate the same result.
      (i.e. by generating several random hashes and querying those)
- [ ] Implement recursive mapping (with adjustable depth-limit)
- [ ] Implement CLI (i.e. `$ cat wordlist.txt | dnsmap -o result.tsv | pbcopy`)
- [ ] Implement serveral CLI output formats (tsv, csv(?), toml, json, txt, ...?)
- [x] Filter our records with a A record of 127.0.53.53 (see https://icann.org/namecollision)

NOTE:
  
TOML seems quite suitable for this kind of data,
and features a nice tradeoff between machine- & human-readability.

```toml
[email.example.com]
  A = [ "167.189.125.0" ]
  AAAA = []
  MX = [
    { exchange: 'mx2.sendgrid.net', priority: 10 },
    { exchange: 'mx.sendgrid.net', priority: 20 },
  ]
  TXT = [
    "v=spf1 ip4:175.126.200.128/27 ip4:175.126.253.0/24 ip4:167.228.50.32/27 ip4:174.136.80.208/28 ip4:174.136.92.96/27 include:sendgrid.biz ~all",
  ]
  SRV = []
  NS = [
    "ns14.dnsmadeeasy.com",
    "ns11.dnsmadeeasy.com",
    "ns15.dnsmadeeasy.com",
    "ns13.dnsmadeeasy.com",
    "ns12.dnsmadeeasy.com",
    "ns10.dnsmadeeasy.com",
  ]
  CNAME: [ "sendgrid.net" ]
  NAPTR: []
```
