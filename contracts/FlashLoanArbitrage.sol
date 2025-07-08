// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBalancerVault {
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

contract FlashLoanArbitrage is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IBalancerVault public constant balancerVault = IBalancerVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8);
    
    // DEX Routers
    IUniswapV2Router public constant uniswapV2Router = IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IUniswapV3Router public constant uniswapV3Router = IUniswapV3Router(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    
    // Common tokens
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86a33E6417aeb71;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    struct ArbitrageParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        address dexA; // Buy from this DEX
        address dexB; // Sell to this DEX
        uint24 feeA;  // Fee for DEX A (Uniswap V3)
        uint24 feeB;  // Fee for DEX B (Uniswap V3)
        uint256 minProfitBps; // Minimum profit in basis points (1% = 100 bps)
    }

    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 profit,
        address indexed executor
    );

    event FlashLoanReceived(
        address indexed asset,
        uint256 amount,
        uint256 premium
    );

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == address(this), "Unauthorized");
        _;
    }

    constructor() {}

    /**
     * @notice Execute arbitrage using Balancer flash loan
     * @param tokens Array of token addresses to borrow
     * @param amounts Array of amounts to borrow
     * @param params Encoded arbitrage parameters
     */
    function executeArbitrage(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory params
    ) external onlyAuthorized nonReentrant {
        require(tokens.length == amounts.length, "Array length mismatch");
        require(tokens.length > 0, "No tokens specified");

        // Execute Balancer flash loan
        balancerVault.flashLoan(address(this), tokens, amounts, params);
    }

    /**
     * @notice Balancer flash loan callback
     * @param tokens Borrowed token addresses
     * @param amounts Borrowed amounts
     * @param feeAmounts Flash loan fees
     * @param userData Encoded arbitrage parameters
     */
    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external {
        require(msg.sender == address(balancerVault), "Only Balancer Vault");

        ArbitrageParams memory params = abi.decode(userData, (ArbitrageParams));
        
        emit FlashLoanReceived(tokens[0], amounts[0], feeAmounts[0]);

        // Execute the arbitrage
        uint256 profit = _executeArbitrageLogic(params, amounts[0]);

        // Ensure we have enough to repay the flash loan
        uint256 repayAmount = amounts[0] + feeAmounts[0];
        require(
            IERC20(tokens[0]).balanceOf(address(this)) >= repayAmount,
            "Insufficient balance to repay flash loan"
        );

        // Transfer tokens back to Balancer Vault
        IERC20(tokens[0]).safeTransfer(address(balancerVault), repayAmount);

        emit ArbitrageExecuted(params.tokenIn, params.tokenOut, amounts[0], profit, tx.origin);
    }

    /**
     * @notice Internal function to execute arbitrage logic
     * @param params Arbitrage parameters
     * @param flashLoanAmount Amount borrowed via flash loan
     * @return profit Profit earned from arbitrage
     */
    function _executeArbitrageLogic(
        ArbitrageParams memory params,
        uint256 flashLoanAmount
    ) internal returns (uint256 profit) {
        uint256 initialBalance = IERC20(params.tokenIn).balanceOf(address(this));

        // Step 1: Buy tokens on DEX A (cheaper exchange)
        uint256 amountOut1 = _executeSwapOnDEX(
            params.dexA,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.feeA
        );

        // Step 2: Sell tokens on DEX B (more expensive exchange)
        uint256 amountOut2 = _executeSwapOnDEX(
            params.dexB,
            params.tokenOut,
            params.tokenIn,
            amountOut1,
            params.feeB
        );

        uint256 finalBalance = IERC20(params.tokenIn).balanceOf(address(this));
        
        // Calculate profit
        profit = finalBalance > initialBalance ? finalBalance - initialBalance : 0;
        
        // Ensure minimum profit threshold is met
        uint256 minProfit = (flashLoanAmount * params.minProfitBps) / 10000;
        require(profit >= minProfit, "Insufficient profit");

        return profit;
    }

    /**
     * @notice Execute swap on specified DEX
     * @param dex DEX router address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param fee Fee tier (for Uniswap V3)
     * @return amountOut Output amount received
     */
    function _executeSwapOnDEX(
        address dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee
    ) internal returns (uint256 amountOut) {
        IERC20(tokenIn).safeApprove(dex, amountIn);

        if (dex == address(uniswapV3Router)) {
            // Uniswap V3
            IUniswapV3Router.ExactInputSingleParams memory swapParams = IUniswapV3Router.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                deadline: block.timestamp + 300, // 5 minutes
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

            amountOut = uniswapV3Router.exactInputSingle(swapParams);
        } else {
            // Uniswap V2 / SushiSwap
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;

            uint[] memory amounts = IUniswapV2Router(dex).swapExactTokensForTokens(
                amountIn,
                0, // Accept any amount of tokens out
                path,
                address(this),
                block.timestamp + 300
            );

            amountOut = amounts[1];
        }

        return amountOut;
    }

    /**
     * @notice Calculate potential profit for arbitrage opportunity
     * @param params Arbitrage parameters
     * @return estimatedProfit Estimated profit in basis points
     */
    function calculatePotentialProfit(ArbitrageParams memory params) 
        external 
        view 
        returns (uint256 estimatedProfit) 
    {
        // Get quote from DEX A (buying)
        uint256 amountOut1 = _getQuote(params.dexA, params.tokenIn, params.tokenOut, params.amountIn, params.feeA);
        
        // Get quote from DEX B (selling)
        uint256 amountOut2 = _getQuote(params.dexB, params.tokenOut, params.tokenIn, amountOut1, params.feeB);
        
        if (amountOut2 > params.amountIn) {
            estimatedProfit = ((amountOut2 - params.amountIn) * 10000) / params.amountIn;
        } else {
            estimatedProfit = 0;
        }
        
        return estimatedProfit;
    }

    /**
     * @notice Get quote from DEX
     * @param dex DEX router address
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param fee Fee tier
     * @return amountOut Expected output amount
     */
    function _getQuote(
        address dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee
    ) internal view returns (uint256 amountOut) {
        if (dex == address(uniswapV2Router)) {
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
            
            uint[] memory amounts = uniswapV2Router.getAmountsOut(amountIn, path);
            amountOut = amounts[1];
        } else {
            // For Uniswap V3, we'd need to use a quoter contract
            // For simplicity, returning a mock value
            amountOut = amountIn; // This should be replaced with actual V3 quoter logic
        }
        
        return amountOut;
    }

    /**
     * @notice Emergency withdrawal function
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
