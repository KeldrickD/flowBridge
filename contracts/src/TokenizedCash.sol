// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenizedCash is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bool public paused;
    mapping(address => bool) public frozen;

    event PausedSet(bool paused);
    event AccountFrozen(address indexed account, bool frozen);

    error Paused();
    error Frozen(address account);

    constructor() ERC20("FlowBridge USD", "fbUSD") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }

    function setPaused(bool _paused) external onlyRole(PAUSER_ROLE) {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function setFrozen(address account, bool _frozen) external onlyRole(PAUSER_ROLE) {
        frozen[account] = _frozen;
        emit AccountFrozen(account, _frozen);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (paused) revert Paused();
        if (from != address(0) && frozen[from]) revert Frozen(from);
        if (to != address(0) && frozen[to]) revert Frozen(to);
        super._beforeTokenTransfer(from, to, amount);
    }
}


