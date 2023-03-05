//Send native token to this contract and withdraw from this contract

//contracts like metamask wallets can also hold tokens (a contract is deployed at an address in the blockchain)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConvertor.sol"; //PriceConvertor library
import "hardhat/console.sol";

error FundMe__NotOwner();

//NatSpec: Ethereum Natural Language Specification Format
/** @author Mayank Pandey
 *  @title A contract for crowdfunding
 *  @notice The contract demonstrates how people can fund to this contract and only the owner can withdraw the donated funds
 */

contract FundMe {
    using PriceConvertor for uint256;

    address[] private s_funders;
    mapping(address => uint256) s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;
    //752,749 without constant
    //733,435 with constant
    //710,472 with immutable

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    //view functions: cost only applies when called by a contract
    //23,471 * 20000000000 = $0.75 without constant
    //21,371 * 20000000000 = $0.69 with constant

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "You are not the owner");
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    function fund() public payable {
        //we can send tokens to this function or to the contract
        //using this function
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); //1e18 is in wei 1*10^18 wei = 1 ether
        //18 decimals
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            s_addressToAmountFunded[s_funders[i]] = 0;
        }

        //reset the array
        s_funders = new address[](0);

        //withdrawing the total amount of eth funded to this contract
        //whosoever will press the withdraw button(call the withdraw function) will get all the ethers
        //payable(msg.sender).transfer(address(this).balance);

        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, " Transaction failed");

        (bool callSuccess /*bytes memory functionReturnedData*/, ) = payable(
            msg.sender
        ).call{value: address(this).balance}("");
        require(callSuccess, "Withdraw failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    fallback() external payable {
        console.log("----- fallback:", msg.value);
    }

    receive() external payable {
        console.log("----- receive:", msg.value);
    }
}
