/**
 * Deploy USDT ERC20 token to chaink-rpc.alphatrue.net
 * Run: bun scripts/deploy-erc20.ts
 */

import { createWalletClient, createPublicClient, http, encodeAbiParameters, parseAbiParameters } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { execSync } from "child_process"
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "fs"
import { join } from "path"
import os from "os"

const RPC_URL = "https://chaink-rpc.alphatrue.net"
const PRIVATE_KEY = "0xb71c71a67e1177ad4e901695e1b4b9ee17ae16c6668d313eac2f96dbcda3f291"

const TOKEN_NAME = "USDT"
const TOKEN_SYMBOL = "USDT"
const TOKEN_DECIMALS = 6
const INITIAL_SUPPLY = 1_000_000_000n * (10n ** 6n) // 1 billion

// ─── Compile ──────────────────────────────────────────────────────────────────

const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
        emit Transfer(address(0), msg.sender, _supply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "insufficient balance");
        require(allowance[from][msg.sender] >= value, "insufficient allowance");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
`

const tmpDir = join(os.tmpdir(), `erc20-${Date.now()}`)
mkdirSync(join(tmpDir, "src"), { recursive: true })
writeFileSync(join(tmpDir, "src", "Token.sol"), solidityCode)

console.log("Compiling...")
execSync(
  `forge build --root ${tmpDir} --contracts ${join(tmpDir, "src")} --out ${join(tmpDir, "out")} --no-auto-detect`,
  { stdio: "inherit" }
)

const artifact = JSON.parse(readFileSync(join(tmpDir, "out", "Token.sol", "Token.json"), "utf8"))
const bytecode = artifact.bytecode.object as string
rmSync(tmpDir, { recursive: true })

// ─── Deploy ───────────────────────────────────────────────────────────────────

const constructorArgs = encodeAbiParameters(
  parseAbiParameters("string, string, uint8, uint256"),
  [TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY]
)

const deployData = (bytecode.startsWith("0x") ? bytecode : "0x" + bytecode) + constructorArgs.slice(2) as `0x${string}`

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
const publicClient = createPublicClient({ transport: http(RPC_URL) })
const chainId = await publicClient.getChainId()

const chain = {
  id: chainId,
  name: "AlphaTrue",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const

const walletClient = createWalletClient({ account, transport: http(RPC_URL), chain })

console.log(`Deployer:  ${account.address}`)
console.log(`Chain ID:  ${chainId}`)
console.log(`Token:     ${TOKEN_NAME} (${TOKEN_SYMBOL}), decimals=${TOKEN_DECIMALS}`)
console.log(`Supply:    ${(INITIAL_SUPPLY / 10n ** 6n).toLocaleString()} USDT`)
console.log("Deploying...")

const txHash = await walletClient.sendTransaction({ data: deployData })
console.log(`Tx:        ${txHash}`)
console.log("Waiting for receipt...")

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

console.log("")
console.log("✅ Deployed!")
console.log(`Contract:  ${receipt.contractAddress}`)
console.log("")
console.log("Next: add this token in the faucet admin panel (/admin → Tokens tab)")
