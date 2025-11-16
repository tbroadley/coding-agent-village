# Usage

```shell
docker compose up --build
```

# TODO

- [ ] Solve this error:

```
asciinema-1    | 01:43:19.344 [error] Could not check origin for Phoenix.Socket transport.
asciinema-1    | 
asciinema-1    | Origin of the request: http://localhost:4000
asciinema-1    | 
asciinema-1    | This happens when you are attempting a socket connection to
asciinema-1    | a different host than the one configured in your config/
asciinema-1    | files. For example, in development the host is configured
asciinema-1    | to "localhost" but you may be trying to access it from
asciinema-1    | "127.0.0.1". To fix this issue, you may either:
asciinema-1    | 
asciinema-1    |   1. update [url: [host: ...]] to your actual host in the
asciinema-1    |      config file for your current environment (recommended)
asciinema-1    | 
asciinema-1    |   2. pass the :check_origin option when configuring your
asciinema-1    |      endpoint or when configuring the transport in your
asciinema-1    |      UserSocket module, explicitly outlining which origins
asciinema-1    |      are allowed:
asciinema-1    | 
asciinema-1    |         check_origin: ["https://example.com",
asciinema-1    |                        "//another.com:888", "//other.com"]
```

Maybe could specify asciinema as an equivalent of localhost on Windows?
