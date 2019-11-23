pragma solidity 0.4.24;

import "./BasicForeignCompoundBridge.sol";
import "../CompoundBridge.sol";

contract ForeignCompoundBridgeErcToErc is BasicForeignCompoundBridgeErcToErc, CompoundBridge {
    function initialize(
        address _validatorContract,
        address _erc20token,
        address _ctoken,
        uint256 _requiredBlockConfirmations,
        uint256 _gasPrice,
        uint256[] _dailyLimitMaxPerTxMinPerTxArray, // [ 0 = _dailyLimit, 1 = _maxPerTx, 2 = _minPerTx ]
        uint256[] _homeDailyLimitHomeMaxPerTxArray, // [ 0 = _homeDailyLimit, 1 = _homeMaxPerTx ]
        address _owner,
        uint256 _decimalShift
    ) external returns (bool) {
        _initialize(
            _validatorContract,
            _erc20token,
            _ctoken,
            _requiredBlockConfirmations,
            _gasPrice,
            _dailyLimitMaxPerTxMinPerTxArray,
            _homeDailyLimitHomeMaxPerTxArray,
            _owner,
            _decimalShift
        );
        return isInitialized();
    }
}
