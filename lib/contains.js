const Promise = require('bluebird')

function contains(imap, mailbox, header, query) {
  return new Promise((resolve, reject) => {
    imap.openBox(mailbox, true, (err, box) => {
      if (err) return reject(err)

      const search = [['HEADER', header, query]]

      imap.search(search, (err, results) => {
        if (err) return reject(err)

        imap.closeBox(false, () => {})
        resolve(!!results.length)
      })
    })
  })
}

module.exports = contains
