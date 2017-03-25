const fs = require('fs')
const Promise = require('bluebird')

function lineCount(file) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file)
    let i
    let count = 0

    stream.on('data', chunk => {
      for (i = 0; i < chunk.length; i++) {
        if (chunk[i] === 10) count++
      }
    })

    stream.on('end', () => resolve(count))
  })
}

module.exports = lineCount
