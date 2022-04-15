#### Requirements
```
node version: v16.14.2
npm version: 8.5.0
nvm version: 0.34.0 
```

#### Dependencies
```
npm install
```

#### Run the verifier:
```
node index.js port {leveldb location - will be created here if not exists} {blockchain explorer ip}
   default for leveldb location: /tmp/tol-verifier
   default for blockchain explorer ip: web-explorer.stagenet.tolar.io
```

Fetch solidity code for address that has a verified contract:
```
127.0.0.1:port/contract/:address
```

Send a solidity code for a contract address to verify (POST request):
```
// Build the post string from an object
var post_data = querystring.stringify({
    'contract_code' : ... solidity code ...,
    'contract_address': ... tolar contract address ...,
    'compiler_version': e.g. 'v0.8.9+commit.e5eed63a',
    'contract_filename': e.g. 'test.sol',
    'evm_version': e.g. 'london',
    'optimized': true/false,
    'optimization_runs': e.g. 200,
});
  
// An object of options to indicate where to post to
var post_options = {
    host: '127.0.0.1',
    port: '3003',
    path: '/verify',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(post_data)
    }
};

// Send the POST request
```

#### Docker
```
docker build . -t verifier:1.0
docker run -p 3003:3003 verifier:1.0
```