if (process.argv.length != 3) {
    console.log("At least one parameter needed to start the server");
    console.log("run it like this: node index.js port");
    return -1;
}

const port = process.argv[2];

const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log(solc.version())

const express = require("express");
const router = express.Router();
const app = express();
const bodyParser = require("body-parser")

const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));


router.get('/healthy', (_request, response) => {
        response.status(200).send("OK");
});

router.get('/ready', (_request, response) => {
        response.status(200).send("OK");
});

router.post('/verify', (request, response) => {
    console.log('+++ request +++')
    console.log(request.body)
    console.log('++++++++')

    var filename = request.body.contract_filename || "test";
    if (filename.slice(-4).toLowerCase() == '.sol') {
        filename = filename.slice(-4);
    }
    filename = filename.replace(/[^A-Za-z0-9]/g, '')
    filename = 'contracts/' + filename + '.sol';
    console.log(filename)
    filename = 'contracts/bzvz.sol' // testing

    const input = {
        language: 'Solidity',
        sources: {
            [filename]: {content : request.body.contract_code}
        },
        "settings": {
            "optimizer": {
                "enabled": false,
                "runs": 200
            },
            "outputSelection": {
                "*": {
                    "": [
                        "ast"
                    ],
                    "*": [
                        "abi",
                        "metadata",
                        "devdoc",
                        "userdoc",
                        "evm.legacyAssembly",
                        "evm.bytecode",
                        "evm.deployedBytecode",
                        "evm.methodIdentifiers",
                        "evm.gasEstimates",
                        "evm.assembly"
                    ]
                }
            },
            "evmVersion": "petersburg"
        }
    };

    let output = JSON.parse(solc.compile(JSON.stringify(input)))

    var result;
    for (var contractName in output.contracts[filename]) {
        console.log(contractName + ': ' + output.contracts[filename][contractName].evm.bytecode.object)
        console.log("+++++++")
        console.log(output.contracts[filename][contractName]);
        console.log("+++++++")
        result = output.contracts[filename][contractName].evm.bytecode.object
    }


    response.status(200).send(result)
});

// add router in the Express app.
app.use("/", router);

app.listen(port, () => {
  console.log(`Faucet app listening at port: ${port}`)
})