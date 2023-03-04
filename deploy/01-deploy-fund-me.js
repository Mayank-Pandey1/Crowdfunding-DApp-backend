//import
//main function
//calling of main function

// function deployFunc(hre) {
//      console.log("Hi");
//      const {getNamedAccounts, deployments} = hre
//      hre.getNamedAccounts()
//      hre.deployments
// }

// module.exports.default = deployFunc;

const { network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //getting variables from deployments object
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;
    //console.log(chainId);
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    //when working with localhost or hardhat we will create a mock.

    //Mocking is primarily used in unit testing. An object under test may have dependencies on other (complex) objects.
    //To isolate the behaviour of the object you want to test you replace the other objects by mocks that simulate
    //the behaviour of the real objects. This is useful if the real objects are impractical to incorporate into the
    //unit test.

    //In short, mocking is creating objects that simulate the behaviour of real objects.

    const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put priceFeed Address here
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
};

module.exports.tags = ["all", "fundme"];
