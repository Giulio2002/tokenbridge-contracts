pragma solidity 0.4.24;

interface ICToken {
    function balanceOf(address owner) public returns (uint);
    function approve(address _spender, uint256 _value) public returns (bool success);
    function balanceOfUnderlying(address owner) public returns (uint);
    function mint(uint mintAmount) public returns (uint);
    function redeemUnderlying(uint redeemAmount) public returns (uint);
}
