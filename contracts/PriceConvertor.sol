//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConvertor {
    //We will make two functions:

    //1. to get the current native blockchain token price (for checking if the value of sent ethers
    // is greater than the value specified in dollars) we will make getTokenPrice() function

    //2. to get the conversion rate: we make getConversionRate function

    //In the first function we will be interacting with the outer world to get the token price in dollars
    //so we use an Oracle network for this: the chainlink oracle network
    //chainlink oracle has a feature of Data Feeds
    //Chainlink Data Feeds are the quickest way to connect your smart contracts to the real-world
    //data such as asset prices, reserve balances, and L2 sequencer health.
    //Data Feeds 'aggregate' many data sources and publish them on-chain using a combination of the
    //Decentralized Data Model and Off-Chain Reporting.

    //and we need to interact with the data feeds' eth-to-usd contract
    function getTokenPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //We need two things for interacting with a contract: The contract's ABI and address

        //The contract name of chainlink data feeds' eth-to-usd convertor contract is AggregatorV3
        //in the ABI of a contract we see the information of contract's functions
        //and if we want to get the AggregatorV3's ABI we need to import the contract, which would be very large
        //so we use the interface of aggregatorV3 contract, which only has declaration of contract's functions

        /**
         * Network: Goerli
         * Aggregator: ETH/USD
         * Address on which it is deployed : 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
         */

        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();

        //eth to USD: 1579.00000000
        return uint256(price * 1e10);
    }

    // function getVersion() public view returns(uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);
    //     return priceFeed.version();
    // }

    //1 ether(ethAmount) at the price of 3000 USD (ethPrice) is going to be 3000usd
    //6 ethers (ethAmount) at the price of 3000 USD (ethPrice) is going to be 18000usd

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getTokenPrice(priceFeed);
        uint256 totalEthAmountInUSD = (ethPrice * ethAmount) / 1e18;
        return totalEthAmountInUSD;
    }
}
