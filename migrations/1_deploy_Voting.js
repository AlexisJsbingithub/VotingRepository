var Migrations = artifacts.require("./Voting.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
