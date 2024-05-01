import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-foundry";
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

import "./tasks/1_generatePP";
import "./tasks/2_createCicadaVote";
import "./tasks/3_castBallot";
import "./tasks/4_expireVotes";
import "./tasks/5_finalizeVote";
import "./tasks/getPublicParams";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 30,
        passphrase: "",
      },
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    olasTestUser: {
      default: 1
    },
    olasGlobalPool: {
      default: 2
    }
  },
};

export default config;
