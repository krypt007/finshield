// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Initializable {
  bool public initialized;

  modifier initializer() {
    require(!initialized);
    initialized = true;
    _;
  }
}


contract CompanyRegistry is Initializable, Ownable {

  struct Company {
    address owner;
    string companyName;

    // bytes32 certificateOfIncorporation;
    // bytes32 taxComplianceCert;
    // bytes32 bankAccountDetails;
    // bytes32 proofofAddress;
    // bytes32 [] certifications;
    
    address[] documents;
    uint256 currentIndex;
    uint256 depositAmount;
    address tokenAddress;
    uint256 timestamp;
    mapping(address => uint256) balances;
  }
  mapping (bytes32 => Company) companies;
  mapping (address => bytes32[]) companyDocuments;

  function initialize() external initializer {
    transferOwnership(msg.sender);
  }
  
  function companyDocs(bytes32 hashedName) public view returns (address[] memory) {
    return companies[hashedName].documents;
  }

  function getCompanyInfo(bytes32 hashedName) public view returns (string memory, address[] memory, address, uint256, uint256, uint256) {
    Company storage company = companies[hashedName];
    return (company.companyName, company.documents, company.tokenAddress, company.depositAmount, company.timestamp, company.currentIndex);
  }

  function addCompany(string calldata companyName, address[] calldata documents, address tokenAddress, uint256 depositAmount) external {
    bytes32 hashedName = keccak256(abi.encodePacked(companyName));

    require(companyDocs(hashedName).length == 0, "Already added company");

    Company storage company = companies[hashedName];

    company.owner = msg.sender;
    company.documents = documents;
    company.tokenAddress = tokenAddress;
    company.depositAmount = depositAmount;
    company.companyName = companyName;
    // solhint-disable-next-line not-rely-on-time
    company.timestamp = block.timestamp;

    for (uint256 index = 0; index < documents.length; index++) {
      companyDocuments[documents[index]].push(hashedName);
    }
  }
}
