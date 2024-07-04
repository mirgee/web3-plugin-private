import { Web3 } from "web3";
import { PrivPlugin } from "../../src/index"

describe('basic test', () => {

  let web3: Web3;

  beforeAll(async () => {
    web3 = new Web3("http://127.0.0.1:20000");
    web3.registerPlugin(new PrivPlugin());
  })

  it('create privacy group', async () => {
    const result = await web3.priv.createPrivacyGroup(['BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=', 'QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc='], 'privacygroup1', 'Privacy Group 1');
    console.log(`Obtained result ${JSON.stringify(result)}`);
  })
})
