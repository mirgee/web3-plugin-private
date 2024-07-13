[![npm](https://img.shields.io/npm/v/web3-plugin-private)](https://www.npmjs.com/package/web3-plugin-private)
<!-- [![Known Vulnerabilities](https://snyk.io/test/github/ConsenSys/web3js-quorum/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ConsenSys/web3js-quorum?targetFile=package.json) -->

# web3-plugin-private

This project builds on (currently unmaintained) [web3js-quorum](https://github.com/ConsenSys/web3js-quorum) by Concensys to provide an extension to the [web3.js](https://github.com/web3/web3.js) Ethereum client, adding support for [Hyperledger Besu](https://besu.hyperledger.org/en/stable/) [private JSON-RPC APIs](https://besu.hyperledger.org/development/private-networks/reference/api) and features such as [private transactions](https://besu.hyperledger.org/development/private-networks/how-to/send-transactions/private-transactions).

Please read the [Besu documentation](https://besu.hyperledger.org/) for more information.

## Features

- Supports JSON-RPC APIs
- Create and send private transactions
- Privacy group management

## Installation

```shell
npm install web3 web3-plugin-private
```

## Quickstart

```js
import Web3 from 'web3';
import { PrivPlugin } from 'web3-plugin-private';
const web3 = new Web3("http://localhost:20000");
web3.registerPlugin(new PrivPlugin());
await web3.priv.generateAndSendRawTransaction(options);
```

## Examples

The [example](https://github.com/mirgee/web3-plugin-private/tree/main/web3-plugin-private/test/examples) directory contains examples of `web3-plugin-private` usage with Besu.  
