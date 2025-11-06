// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TokenizedCash.sol";
import "../src/PaymentRouter.sol";

contract PaymentRouterTest is Test {
    TokenizedCash cash;
    PaymentRouter router;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        cash = new TokenizedCash();
        router = new PaymentRouter(cash);
        cash.grantRole(cash.MINTER_ROLE(), address(this));
        cash.mint(alice, 1_000 ether);
        vm.startPrank(alice);
        cash.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function test_InitiateAndSettlePayment() public {
        vm.startPrank(alice);
        bytes32 ref = keccak256("offchain");
        bytes32 id = router.initiatePayment(
            bob,
            100 ether,
            true,
            ref,
            uint64(block.timestamp + 1 days)
        );
        vm.stopPrank();

        vm.prank(alice);
        router.settlePayment(id);
        assertEq(cash.balanceOf(bob), 100 ether);
    }
}


