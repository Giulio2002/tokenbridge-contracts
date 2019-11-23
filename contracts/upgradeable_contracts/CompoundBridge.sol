pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ERC20Bridge.sol";
import "../interfaces/ICToken.sol";

contract CompoundBridge is ERC20Bridge {
    using SafeMath for uint256;

    bytes32 internal constant DEPOSITED = 0x2481b1d2de4705a3d6f16fcad41f3da3d5cea523dcc13e7e981eacc3bb0569dd; // keccak256(abi.encodePacked("deposited"))
    bytes32 internal constant CTOKEN = 0x44272b6fc3aef7ade2f170f994d98e96dcb1300e5a8b2c7f6b79c565ad70b4ca; // keccak256(abi.encodePacked("ctoken"))

    function ctoken() public view returns (ICToken) {
        return ICToken(addressStorage[CTOKEN]);
    }

    function setCtoken(address _token) internal {
        require(AddressUtils.isContract(_token));
        addressStorage[CTOKEN] = _token;
    }

    function deposited() public view returns (uint256) {
        return uintStorage[DEPOSITED];
    }

    function setDeposited(uint256 _deposited) internal {
        uintStorage[DEPOSITED] = _deposited;
    }

    function _relayTokens(address _sender, address _receiver, uint256 _amount) internal {
        require(_receiver != address(0));
        require(_receiver != address(this));
        require(_amount > 0);
        require(withinLimit(_amount));
        setTotalSpentPerDay(getCurrentDay(), totalSpentPerDay(getCurrentDay()).add(_amount));

        erc20token().transferFrom(_sender, address(this), _amount);
        ctoken().mint(_amount);
        setDeposited(deposited().add(_amount));
        emit UserRequestForAffirmation(_receiver, _amount);
    }

    function relayTokens(address _from, address _receiver, uint256 _amount) external {
        require(_from == msg.sender || _from == _receiver);
        _relayTokens(_from, _receiver, _amount);
    }

    function join(address _receiver, uint256 _amount) external {
        require(_receiver != address(0));
        require(_receiver != address(this));
        require(_amount > 0);
        erc20token().transferFrom(msg.sender, address(this), _amount);
        ctoken().mint(_amount);
        setDeposited(deposited().add(_amount));
        emit UserRequestForAffirmation(_receiver, _amount);
    }

    function claimInterest(uint _amount) onlyOwner external {
        uint256 claimable = ctoken().balanceOfUnderlying(address(this)).sub(deposited());
        require(_amount <= claimable);
        ctoken().redeemUnderlying(_amount);
        erc20token().transfer(msg.sender, _amount);
    }
}
