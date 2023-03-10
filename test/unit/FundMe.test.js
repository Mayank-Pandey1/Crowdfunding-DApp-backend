const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1"); //1 ETH
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              //specifying which account we want connected to our deployed fundMe contract since we will be making transactions
              //while testing
              await deployments.fixture(["all"]); //using fixture we can deploy our contracts with as many tags as we want
              //running all the deploy scripts using this line
              fundMe = await ethers.getContract("FundMe", deployer);

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function () {
              it("sets the priceFeed addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(mockV3Aggregator.address, response);
              });
          });

          describe("fund", function () {
              it("check it fails if don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  );
              });

              it("check the amount funded by address is updated in mapping data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(sendValue.toString(), response.toString());
              });

              it("adds funder to array of funders", async () => {
                  // const length = fundMe.s_funders.length;
                  // await fundMe.fund({ value: sendValue });
                  // assert.equal(length + 1, fundMe.s_funders.length);
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", function () {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("ETH is withdrawn by only one owner/account", async () => {
                  const initialContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const newContractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const newDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  assert.equal(newContractBalance, 0);
                  assert.equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      newDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const initialContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const newContractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const newDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  assert.equal(newContractBalance, 0);
                  assert.equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      newDeployerBalance.add(gasCost).toString()
                  );

                  //funders array is reset if any of the funders withdraws
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
              //   it("only allow the owner to withdraw", async () => {
              //       const accounts = await ethers.getSigners();
              //       //suppose the random non-owner account which tries to withdraw is account no. 1
              //       const attackerConnectedContract = await fundMe.connect(
              //           accounts[1]
              //       );
              //       await expect(
              //           attackerConnectedContract.withdraw()
              //       ).to.be.revertedWith("FundMe__NotOwner"); //if account 1 tries to withdraw, then the transaction is reverted
              //   });
          });
      });
