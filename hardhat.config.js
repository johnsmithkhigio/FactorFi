import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config = {
  solidity: "0.8.24",
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

export default config;
