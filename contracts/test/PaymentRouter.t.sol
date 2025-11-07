// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TokenizedCash.sol";
import "../src/PaymentRouter.sol";
import "../src/libs/Types.sol";
import "../src/libs/Errors.sol";

contract PaymentRouterTest is Test {
    TokenizedCash cash;
    PaymentRouter router;
    address owner = address(0xA11CE);
    address orchestrator = address(0x0RCHE);
    address payer = address(0xBEEF);
    address payee = address(0xCAFE);
    address attacker = address(0xBAD);
    bytes32 offchainRef = keccak256("OFFCHAIN_REF");
    uint256 constant INITIAL_BALANCE = 1_000_000 ether;

    function setUp() public {
        vm.startPrank(owner);
        cash = new TokenizedCash();
        router = new PaymentRouter(cash);
        cash.grantRole(cash.MINTER_ROLE(), owner);
        cash.mint(payer, INITIAL_BALANCE);
        router.setOrchestrator(orchestrator);
        vm.stopPrank();

        vm.startPrank(payer);
        cash.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function _initEscrowedPayment(uint256 amount, uint64 ttlSeconds) internal returns (bytes32 paymentId) {
        vm.prank(payer);
        uint64 expiresAt = uint64(block.timestamp + ttlSeconds);
        paymentId = router.initiatePayment(payee, amount, true, offchainRef, expiresAt);
    }

    function test_initiatePaymentEscrowedStoresState() public {
        uint256 amount = 100 ether;
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(payer);
        bytes32 paymentId = router.initiatePayment(payee, amount, true, offchainRef, expiresAt);

        Types.PaymentRequest memory p = router.payments(paymentId);
        assertEq(p.payer, payer);
        assertEq(p.payee, payee);
        assertEq(p.amount, amount);
        assertTrue(p.escrow);
        assertEq(p.offchainRef, offchainRef);
        assertEq(p.expiresAt, expiresAt);
        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Escrowed));
    }

    function test_initiatePaymentNonEscrowed() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.prank(payer);
        bytes32 paymentId = router.initiatePayment(payee, 1 ether, false, offchainRef, expiresAt);
        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Initiated));
    }

    function test_initiatePaymentRevertZeroAmount() public {
        vm.prank(payer);
        vm.expectRevert(Errors.INVALID_AMOUNT.selector);
        router.initiatePayment(payee, 0, true, offchainRef, uint64(block.timestamp + 1 days));
    }

    function test_initiatePaymentRevertExpired() public {
        vm.prank(payer);
        vm.expectRevert(Errors.EXPIRED.selector);
        router.initiatePayment(payee, 1 ether, true, offchainRef, uint64(block.timestamp));
    }

    function test_initiatePaymentRevertDuplicate() public {
        uint64 expiresAt = uint64(block.timestamp + 1 days);
        vm.startPrank(payer);
        router.initiatePayment(payee, 1 ether, true, offchainRef, expiresAt);
        vm.expectRevert(bytes("PAYMENT_EXISTS"));
        router.initiatePayment(payee, 1 ether, true, offchainRef, expiresAt);
        vm.stopPrank();
    }

    function test_settlePaymentByOrchestrator() public {
        uint256 amount = 100 ether;
        bytes32 paymentId = _initEscrowedPayment(amount, 1 days);
        uint256 routerBalBefore = cash.balanceOf(address(router));
        uint256 payeeBalBefore = cash.balanceOf(payee);

        vm.prank(orchestrator);
        router.settlePayment(paymentId);

        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Settled));
        assertEq(cash.balanceOf(address(router)), routerBalBefore - amount);
        assertEq(cash.balanceOf(payee), payeeBalBefore + amount);
    }

    function test_settlePaymentByPayerAllowed() public {
        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);
        vm.prank(payer);
        router.settlePayment(paymentId);
        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Settled));
    }

    function test_settlePaymentRevertUnauthorized() public {
        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);
        vm.prank(attacker);
        vm.expectRevert(Errors.NOT_AUTHORIZED.selector);
        router.settlePayment(paymentId);
    }

    function test_settlePaymentRevertAlreadySettled() public {
        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);
        vm.prank(orchestrator);
        router.settlePayment(paymentId);
        vm.prank(orchestrator);
        vm.expectRevert(bytes("ALREADY_SETTLED"));
        router.settlePayment(paymentId);
    }

    function test_settlePaymentRevertCancelled() public {
        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);
        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        router.cancelPayment(paymentId);
        vm.prank(orchestrator);
        vm.expectRevert(bytes("ALREADY_CANCELLED"));
        router.settlePayment(paymentId);
    }

    function test_cancelPaymentAfterExpiry() public {
        uint256 amount = 5 ether;
        bytes32 paymentId = _initEscrowedPayment(amount, 1 days);
        uint256 routerBalBefore = cash.balanceOf(address(router));
        uint256 payerBalBefore = cash.balanceOf(payer);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        router.cancelPayment(paymentId);

        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Cancelled));
        assertEq(cash.balanceOf(address(router)), routerBalBefore - amount);
        assertEq(cash.balanceOf(payer), payerBalBefore + amount);
    }

    function test_cancelPaymentRevertBeforeExpiry() public {
        bytes32 paymentId = _initEscrowedPayment(5 ether, 1 days);
        vm.prank(payer);
        vm.expectRevert(Errors.EXPIRED.selector);
        router.cancelPayment(paymentId);
    }

    function test_cancelPaymentRevertNonEscrow() public {
        vm.prank(payer);
        bytes32 paymentId = router.initiatePayment(payee, 5 ether, false, offchainRef, uint64(block.timestamp + 1 days));
        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        vm.expectRevert(bytes("NOT_ESCROW"));
        router.cancelPayment(paymentId);
    }

    function test_cancelPaymentRevertNotPayer() public {
        bytes32 paymentId = _initEscrowedPayment(5 ether, 1 days);
        vm.warp(block.timestamp + 2 days);
        vm.prank(attacker);
        vm.expectRevert(Errors.NOT_PAYER.selector);
        router.cancelPayment(paymentId);
    }

    function test_pauseBlocksFlows() public {
        vm.prank(owner);
        router.setPaused(true);

        vm.prank(payer);
        vm.expectRevert(bytes("PAUSED"));
        router.initiatePayment(payee, 1 ether, true, offchainRef, uint64(block.timestamp + 1 days));

        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);

        vm.prank(orchestrator);
        vm.expectRevert(bytes("PAUSED"));
        router.settlePayment(paymentId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        vm.expectRevert(bytes("PAUSED"));
        router.cancelPayment(paymentId);
    }

    function test_unpauseRestoresFlow() public {
        vm.prank(owner);
        router.setPaused(true);
        vm.prank(owner);
        router.setPaused(false);

        bytes32 paymentId = _initEscrowedPayment(1 ether, 1 days);
        vm.prank(orchestrator);
        router.settlePayment(paymentId);
        assertEq(uint8(router.paymentStatus(paymentId)), uint8(Types.PaymentStatus.Settled));
    }

    function test_onlyOwnerCanSetOrchestratorAndPaused() public {
        vm.prank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        router.setOrchestrator(attacker);

        vm.prank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        router.setPaused(true);
    }
}
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


