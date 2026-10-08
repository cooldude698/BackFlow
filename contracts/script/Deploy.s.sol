// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/AgreementManager.sol";
import "../src/SettlementEngine.sol";

contract DeployBackFlow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        vm.startBroadcast(deployerPrivateKey);

        MockUSDC usdc = new MockUSDC();
        AgreementManager manager = new AgreementManager();
        SettlementEngine engine = new SettlementEngine(address(manager));

        manager.setSettlementEngine(address(engine));

        console.log("MockUSDC deployed to:", address(usdc));
        console.log("AgreementManager deployed to:", address(manager));
        console.log("SettlementEngine deployed to:", address(engine));

        vm.stopBroadcast();
    }
}
