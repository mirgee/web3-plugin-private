import { PrivPlugin } from '../../../src/index';
import Web3 from "web3";

async function run() {
  const web3 = new Web3('http://127.0.0.1:20000');
  web3.registerPlugin(new PrivPlugin());
}

run();
