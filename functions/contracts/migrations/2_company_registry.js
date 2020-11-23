const CompanyRegistry = artifacts.require("CompanyRegistry");

module.exports = function (deployer) {
  deployer.deploy(CompanyRegistry);
};
