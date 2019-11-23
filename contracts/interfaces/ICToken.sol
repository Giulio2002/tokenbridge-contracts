pragma solidity 0.4.24;

interface ICToken {
    function balanceOfUnderlying(address owner) public returns (uint);
    function mint(uint mintAmount) public returns (uint);
    function redeemUnderlying(uint redeemAmount) public returns (uint);
}
