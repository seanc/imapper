const fs = require('fs')
const yn = require('yn')
const rootDomain = require('root-domain')

function mapServers(path) {
  const data = fs.readFileSync(path, { encoding: 'utf8' })
  const list = data.trim().split('\n').map(line => line.split(':'))
  const servers = {}

  list.forEach(item => {
    let [ host, port = 993, tls = true ] = item
    port = parseInt(port)
    tls = yn(tls)

    const key = rootDomain(host)

    servers[key] = { host, port, tls }
  })

  return servers
}

module.exports = { mapServers }
