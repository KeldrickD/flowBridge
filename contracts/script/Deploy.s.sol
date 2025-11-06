// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TokenizedCash.sol";
import "../src/PaymentRouter.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        TokenizedCash cash = new TokenizedCash();
        PaymentRouter router = new PaymentRouter(cash);
        // Optionally grant MINTER_ROLE, setup initial state here
        vm.stopBroadcast();
    }
}


