const { developmentChains } = require("../../helper-hardhat-config");
const { ethers, getNamedAccounts, network } = require("hardhat");
const { assert } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther("0.1");

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("able to fund and withdraw ETH", async function () {
              const fundTxResponse = await fundMe.fund({ value: sendValue });
              await fundTxResponse.wait(1);
              const withdrawTxResponse = await fundMe.withdraw();
              await withdrawTxResponse.wait(1);
              const finalBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(finalBalance.toString(), "0");
          });
      });
