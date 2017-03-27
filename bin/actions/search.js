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
        unmatchingCount++
        spinner.text = `${matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`
        return
      }

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
            if (!boxes.length) {
              unmatchingCount++
              spinner.text = `${matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`
              return
            }

            const results = []

            eachSeries(boxes, (box, next) => {
              contains(client, box, header, query)
              .then(containsQuery => {
                results.push(containsQuery)
                next()
              }).catch(console.log)
            }, () => {
              if (results.some(result => result)) {
                fs.appendFile(output, line + '\n', () => {
                  matchingCount++
                })
              } else {
                unmatchingCount++
              }

              spinner.text = `${matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`
              lr.resume()
            })
          })
        })

        client.on('error', () => {
          client.destroy()
        })

        client.on('close', () => {
          unmatchingCount++
          spinner.text = `${matchingCount} matching, ${unmatchingCount + matchingCount} checked, ${emailCount} total`
          lr.resume()
        })

        client.connect()

      } else {
        lr.resume()
        spinner.text = `${matchingCount} matching, ${++unmatchingCount + matchingCount} checked, ${emailCount} total`
      }
    })

    lr.on('end', () => {
      spinner.succeed(`Finished Checking, ${matchingCount} found matching query ${query} in ${header}`)
      console.log('debug', unmatchingCount + matchingCount)
      process.exit()
    })
  })
}

module.exports = search
