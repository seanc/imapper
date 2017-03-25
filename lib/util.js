const fs = require('fs')
const yn = require('yn')

function mapServers(path) {
  const data = fs.readFileSync(path, { encoding: 'utf8' })
  const list = data.trim().split('\n').map(line => line.split(':'))
  const servers = {}

  list.forEach(item => {
    let [ host, port = 993, tls = true ] = item
    port = parseInt(port)
    tls = yn(tls)

    const key = host.split('.').slice(1).join('.')

    servers[key] = { host, port, tls }
  })

  return servers
}

module.exports = { mapServers }
