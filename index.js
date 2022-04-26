if (process.argv.length != 3 && process.argv.length != 4 && process.argv.length != 5) {
    console.log("At least one parameter needed to start the server");
    console.log("run it like this: node index.js port {leveldb location - will be created here if not exists} {blockchain explorer ip}");
    console.log("   default for leveldb location: /tmp/tol-verifier")
    console.log("   default for blockchain explorer ip: web-explorer.stagenet.tolar.io")
    return -1;
}

const port = process.argv[2];

var leveldb_path = "/tmp/tol-verifier";
if (process.argv.length >= 4) {
    leveldb_path = process.argv[3];
}

var explorer_ip = 'web-explorer.stagenet.tolar.io';
if (process.argv.length >= 5) {
    explorer_ip = process.argv[4];
}

const path = require('path');
const fs = require('fs');

const { Level } = require('level');
const db = new Level(leveldb_path);

const solc = require('solc');
console.log(solc.version())

const express = require("express");
const router = express.Router();
const app = express();
const bodyParser = require("body-parser")

const cors = require("cors");
app.use(cors());
app.use(bodyParser.json({limit: "8mb"}));
app.use(bodyParser.urlencoded({limit: "8mb", extended: true, parameterLimit:8000}));

const util = require('util');
const loadRemoteVersion = util.promisify(solc.loadRemoteVersion);
const utils = require('./utils')


router.get('/healthy', (_request, response) => {
    response.status(200).send("OK");
});

router.get('/ready', (_request, response) => {
    response.status(200).send("OK");
});

router.get('/contract/:address', (request, response) => {
    let address = request.params.address;
    db.get(address)
        .then(result => response.status(200).send(result))
        .catch(err => {
            console.log(err);
            response.status(404).send(err);
        })
});

async function storeContract(solContract, contractAddress) {
    return await db.put(contractAddress, JSON.stringify(solContract));
}

function compileSol(solcSnap, input, filename, contract_to_check) {
    console.log(solcSnap.version());

    let output = JSON.parse(solcSnap.compile(JSON.stringify(input)))
    console.log(output)

    var result = {};
    for (var contractName in output.contracts[filename]) {
        if (contractName != contract_to_check) {
            continue;
        }
        console.log(contractName)
        console.log("{}{}{}}{}{}{}")
        console.log(output.contracts[filename][contractName].abi)  
        result.abi = output.contracts[filename][contractName].abi
        console.log("{}{}{}}{}{}{}")
        console.log(contractName + ': ' + output.contracts[filename][contractName].evm.deployedBytecode.object)
        result.deployedBytecode = output.contracts[filename][contractName].evm.deployedBytecode.object
    }

    return result
}

function compareBytecodes(contract_address, contract_code, compilationResult, response) {
    var params = {
        host: explorer_ip,
        port: 443,
        method: 'GET',
        path: '/api/contract/' + contract_address,
    };
    console.log(params)

    utils.httpRequest(params)
        .then(function (body) {
            console.log(body);
            
            if (body.bytecode == compilationResult.deployedBytecode) {
                console.log('bytecodes identical!')

                storeContract({deployedBytecode: compilationResult.deployedBytecode, contract: contract_code, abi: compilationResult.abi, isErc20: utils.checkIsErc20(compilationResult.abi), isErc721: utils.checkIsErc721(compilationResult.abi)}, contract_address)
                    .then(() => {
                        console.log("Stored solidity source code for " + contract_address)
                        return response.status(200).send({
                            verified: true,
                            status: "Solidity source code for " + contract_address + " is now verified",
                            runtime_bytecode: compilationResult.deployedBytecode,
                            solidity_code: contract_code
                        })
                    })
                    .catch(err => {
                        console.log("Failed to store source code")
                        console.log(err)
                        return response.status(500).send({
                            verified: false,
                            status: "Failed to store solidity source code",
                        })
                    });
            } else {
                console.log('bytecodes are not the same!')
                return response.status(400).send({
                    verified: false,
                    status: "Bytecodes are not the same!",
                })
            }
        })
        .catch(error => {
            console.log(error)
            return response.status(400).send({
                verified: false,
                status: "Error while fetching by contract address",
            })
        })
}

router.post('/verify', (request, response) => {
    var filename = request.body.contract_filename || "test";
    if (filename.slice(-4).toLowerCase() == '.sol') {
        filename = filename.slice(0, -4);
    }
    filename = filename.replace(/[^A-Za-z0-9_]/g, '')
    filename = 'contracts/' + filename + '.sol';
    console.log(filename)

    let optimization_enabled = request.body.optimized == 'true';
    let optimization_runs = parseInt(request.body.optimization_runs) != NaN ? parseInt(request.body.optimization_runs) : 200;

    const input = {
        language: 'Solidity',
        sources: {
            [filename]: { content: request.body.contract_code }
        },
        "settings": {
            "optimizer": {
                "enabled": optimization_enabled,
                "runs": optimization_runs
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
            "evmVersion": request.body.evm_version,
        }
    };

    loadRemoteVersion(request.body.compiler_version)
        .then(solcSnap => compileSol(solcSnap, input, filename, request.body.contract_name))
        .then(compilationResult => compareBytecodes(request.body.contract_address, request.body.contract_code, compilationResult, response))
        .catch(err => {
            console.log(err);
            return response.status(500).send({
                verified: false,
                status: "Error while verifying contract",
            })
        })


});

app.use("/", router);

app.listen(port, () => {
    console.log(`Tolar solidity verifier app listening at port: ${port}`)
})