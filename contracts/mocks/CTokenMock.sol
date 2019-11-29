pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

// Very dumb mock
contract CTokenMock {
    address token;
    mapping (address => uint256) public balanceOf;

    constructor(address _token) public {
        token = _token;
    }

    function balanceOfUnderlying(address owner) public returns (uint) {
        return balanceOf[owner] * 2;
    }

    function mint(uint mintAmount) public returns (uint) {
        ERC20(token).transferFrom(msg.sender, address(this), mintAmount);
        balanceOf[msg.sender] += mintAmount;
    }

    function redeemUnderlying(uint redeemAmount) public returns (uint) {
        ERC20(token).transfer(msg.sender, redeemAmount);
        balanceOf[msg.sender] = 0;
    }
}
