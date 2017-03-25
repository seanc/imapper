const util = require('../../lib/util')
const contains = require('../../lib/contains')
const LineReader = require('line-by-line')
const Imap = require('imap')
const eachSeries = require('async-each-series')
const ora = require('ora')
const fs = require('fs')
const lineCount = require('../../lib/line_count')

function search(query, opts) {
  const { servers, emails, header, output } = opts

  const serverList = util.mapServers(servers)
  let matchingCount = 0
  let unmatchingCount = 0

  lineCount(emails).then(emailCount => {
    const spinner = ora(`0 matching, 0 checked, ${emailCount} total`).start()

    const lr = new LineReader(emails)
    lr.on('line', line => {
      const [ user, password, imapHost ] = line.split(':')
      let host = user.split('@')[1]
      if (imapHost) host = imapHost

      if (serverList.hasOwnProperty(host)) {
        const imapServer = serverList[host]

        const client = new Imap({
          user,
          password,
          host: imapServer.host,
          port: imapServer.port,
          tls: imapServer.tls
        })

        client.once('ready', () => {
          client.getBoxes((err, boxes) => {
            if (err) return console.log(err)

            boxes = Object.keys(boxes).filter(box => !box.includes('[Gmail]'))
            const results = []

            eachSeries(boxes, (box, next) => {
              contains(client, box, header, query)
              .then(containsQuery => {
                results.push(containsQuery)
                next()
              }).catch(console.log)
            }, err => {
              if (err) return console.log(err)

              const matching = results.some(result => result)
              if (matching) {
                fs.appendFile(output, line + '\n', err => {
                  if (err) console.log(err)
                  spinner.text = `${++matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`
                })
              } else {
                spinner.text = `${matchingCount} matching, ${++unmatchingCount + matchingCount} checked, ${emailCount} total`
              }

              let total = matchingCount + unmatchingCount
              if (++total === emailCount) {
                spinner.succeed(`Finished Checking, ${matchingCount} found matching query ${query} in ${header}`)
                process.exit()
              }
            })
          })
        })

        client.once('error', err => console.log(err, line))
        client.once('end', () => console.log('client closed'))
        client.connect()
      }
    })
  })
}

module.exports = search
