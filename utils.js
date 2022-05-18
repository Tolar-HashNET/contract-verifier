const http = require('follow-redirects').http;

function httpRequest(params, postData) {
    return new Promise(function (resolve, reject) {
        var req = http.request(params, function (res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            // cumulate data
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on('end', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        // reject on request error
        req.on('error', function (err) {
            // This is not a "Second reject", just a different sort of failure
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        // IMPORTANT
        req.end();
    });
}

/* ERC20 methods
    function name() public view returns (string)
    function symbol() public view returns (string)
    function decimals() public view returns (uint8)
    function totalSupply() public view returns (uint256)
    function balanceOf(address _owner) public view returns (uint256 balance)
    function transfer(address _to, uint256 _value) public returns (bool success)
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
    function approve(address _spender, uint256 _value) public returns (bool success)
    function allowance(address _owner, address _spender) public view returns (uint256 remaining)
*/

let erc20functions = {
    totalSupply: {
        inputs: [],
        outputs: ['uint256'],
    },
    name: {
        inputs: [],
        outputs: ['string'],
    },
    symbol: {
        inputs: [],
        outputs: ['string'],
    },
    decimals: {
        inputs: [],
        outputs: ['uint8'],
    },
    balanceOf: {
        inputs: ['address'],
        outputs: ['uint256'],
    },
    transfer: {
        inputs: ['address', 'uint256'],
        outputs: ['bool'],
    },
    transferFrom: {
        inputs: ['address', 'address', 'uint256'],
        outputs: ['bool'],
    },
    approve: {
        inputs: ['address', 'uint256'],
        outputs: ['bool'],
    },
    allowance: {
        inputs: ['address', 'address'],
        outputs: ['uint256'],
    }
}

/* ERC20 events
    event Transfer(address indexed _from, address indexed _to, uint256 _value)
    event Approval(address indexed _owner, address indexed _spender, uint256 _value)
*/

let erc20events = {
    Transfer: {
        inputs: ['address', 'address', 'uint256'],
    },
    Approval: {
        inputs: ['address', 'address', 'uint256'],
    },
}

/* ERC721 methods
    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);

    // TODO: check both safeTransferFrom methods, currently unchecked
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable;
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;

    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
    */

let erc721functions = {
    balanceOf: {
        inputs: ['address'],
        outputs: ['uint256'],
    },
    ownerOf: {
        inputs: ['uint256'],
        outputs: ['address'],
    },
    transferFrom: {
        inputs: ['address', 'address', 'uint256'],
        outputs: [],
    },
    approve: {
        inputs: ['address', 'uint256'],
        outputs: [],
    },
    setApprovalForAll: {
        inputs: ['address', 'bool'],
        outputs: [],
    },
    getApproved: {
        inputs: ['uint256'],
        outputs: ['address'],
    },
    isApprovedForAll: {
        inputs: ['address', 'address'],
        outputs: ['bool'],
    }
}

/* ERC721 events
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
*/

let erc721events = {
    Transfer: {
        inputs: ['address', 'address', 'uint256'],
    },
    Approval: {
        inputs: ['address', 'address', 'uint256'],
    },
    ApprovalForAll: {
        inputs: ['address', 'address', 'bool'],
    }
}

function checkAbiMatchInterface(abi, interface) {
    var isOk = true;

    for (let key in interface) {
        // check if the property/key is defined in the object itself, not in parent
        if (interface.hasOwnProperty(key)) {

            var found = false;
            for (var i = 0; i < abi.length; i++) {
                if (abi[i].name == key) {
                    if (interface[key].inputs.length != abi[i].inputs.length) {
                        break;
                    }
                    if (interface[key].outputs != undefined && interface[key].outputs.length != abi[i].outputs.length) {
                        break;
                    }
                    var inputsMatch = true;
                    for (var j = 0; j < abi[i].inputs.length; j++) {
                        if (interface[key].inputs[j] != abi[i].inputs[j].type) {
                            inputsMatch = false;
                            break;
                        }
                    }
                    if (!inputsMatch) {
                        break;
                    }
                    var outputsMatch = true;
                    for (var j = 0; interface[key].outputs != undefined && j < abi[i].outputs.length; j++) {
                        if (interface[key].outputs[j] != abi[i].outputs[j].type) {
                            outputsMatch = false;
                            break;
                        }
                    }
                    if (!outputsMatch) {
                        break;
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log("NOT FOUND " + key)
                isOk = false;
                break;
            }

        }
    }

    console.log("Conforms to given erc standard: ");
    console.log(isOk)
    return isOk;
}

function checkIsErc20(abi) {
    return checkAbiMatchInterface(abi, erc20functions) && checkAbiMatchInterface(abi, erc20events);
}

function checkIsErc721(abi) {
    return checkAbiMatchInterface(abi, erc721functions) && checkAbiMatchInterface(abi, erc721events);
}

module.exports = {
    httpRequest: httpRequest,
    checkIsErc20: checkIsErc20,
    checkIsErc721: checkIsErc721,
};