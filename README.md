# imapper
> Search and save emails in inboxes through imap

## Installation

```sh
$ npm install -g seanc/imapper
```

## Usage

```sh
  Usage: imapper [options] [command]


  Commands:

    search [options] <query>  Search emails matching a query contained in a header

  Options:

    -h, --help  output usage information
```

```sh

  Usage: search [options] <query>

  Search emails matching a query contained in a header

  Options:

    -h, --help            output usage information
    -e, --emails <path>   Path to list of emails
    -s, --servers <path>  Path to list of imap servers
    -r, --header <path>   Header to search in with parameter [SUBJECT, TO, FROM]
    -o, --output <path>   File to output emails matching search query
```

## License

MIT © [Sean Wilson](https://imsean.me)
