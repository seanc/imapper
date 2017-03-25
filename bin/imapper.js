const program = require('commander')

const search = require('./actions/search')

const headers = ['SUBJECT', 'FROM', 'TO']
program.command('search <query>')
  .description('Search emails matching a query contained in a header')
  .option('-e, --emails <path>', 'Path to list of emails')
  .option('-s, --servers <path>', 'Path to list of imap servers')
  .option('-r, --header <path>', 'Header to search in with parameter', headers)
  .option('-o, --output <path>', 'File to output emails matching search query')
  .action(search)

program.parse(process.argv)
