import type {
  BinanceCoinConfig,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  BinanceNetworkOption,
} from '../types.ts';

export const BINANCE_COINS: BinanceCoinConfig[] = [
  {
    symbol: 'USDT',
    name: 'TetherUS',
    badgeColor: '#0E9F6E',
    networks: [
      {
        networkCode: 'TRC20',
        networkName: 'TRON (TRC20)',
        depositAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 1.0,
        confirmations: '19 confirmations · ~1 min',
        addressHint: 'TRON address starting with T (34 characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BSC/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'SOL',
        networkName: 'Solana',
        depositAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.5,
        confirmations: '32 confirmations · ~15 sec',
        addressHint: 'Solana Base58 address (32–44 characters)',
      },
      {
        networkCode: 'TON',
        networkName: 'The Open Network (TON)',
        depositAddress: 'UQBx7f8pM4W6Z2kQ9rJ7P3wS8yH5L9mK2N4tR6vX1aBcD3eF',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '1 block · ~10 sec',
        addressHint: 'TON address starting with EQ or UQ (48 characters)',
      },
      {
        networkCode: 'POLYGON',
        networkName: 'Polygon POS',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '64 confirmations · ~1 min',
        addressHint: 'Polygon/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 5.5,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    badgeColor: '#2563EB',
    networks: [
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BSC/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'SOL',
        networkName: 'Solana',
        depositAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.5,
        confirmations: '32 confirmations · ~15 sec',
        addressHint: 'Solana Base58 address (32–44 characters)',
      },
      {
        networkCode: 'BASE',
        networkName: 'Base Mainnet',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '12 confirmations · ~30 sec',
        addressHint: 'Base/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'POLYGON',
        networkName: 'Polygon POS',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '64 confirmations · ~1 min',
        addressHint: 'Polygon/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'ARBITRUM',
        networkName: 'Arbitrum One',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '12 confirmations · ~30 sec',
        addressHint: 'Arbitrum/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 5.0,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'FDUSD',
    name: 'First Digital USD',
    badgeColor: '#0284C7',
    networks: [
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.2,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BSC/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'SOL',
        networkName: 'Solana',
        depositAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '32 confirmations · ~15 sec',
        addressHint: 'Solana Base58 address (32–44 characters)',
      },
      {
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 4.5,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    badgeColor: '#0EA5E9',
    networks: [
      {
        networkCode: 'SOL',
        networkName: 'Solana (Native)',
        depositAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.45,
        confirmations: '32 confirmations · ~15 sec',
        addressHint: 'Solana Base58 address (32–44 characters)',
      },
    ],
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    badgeColor: '#D97706',
    networks: [
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.35,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    badgeColor: '#EA580C',
    networks: [
      {
        networkCode: 'BTC',
        networkName: 'Bitcoin (Native)',
        depositAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 4.5,
        confirmations: '2 confirmations · ~20 min',
        addressHint: 'Bitcoin address starting with bc1, 1, or 3',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 25,
        withdrawFeeUsd: 0.4,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    badgeColor: '#4F46E5',
    networks: [
      {
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 100,
        minWithdrawUsd: 40,
        withdrawFeeUsd: 4.0,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'ARBITRUM',
        networkName: 'Arbitrum One',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.35,
        confirmations: '12 confirmations · ~30 sec',
        addressHint: 'Arbitrum/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'BASE',
        networkName: 'Base Mainnet',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '12 confirmations · ~30 sec',
        addressHint: 'Base/EVM address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.35,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    badgeColor: '#0088CC',
    networks: [
      {
        networkCode: 'TON',
        networkName: 'The Open Network (TON)',
        depositAddress: 'UQBx7f8pM4W6Z2kQ9rJ7P3wS8yH5L9mK2N4tR6vX1aBcD3eF',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '1 block · ~10 sec',
        addressHint: 'TON address starting with EQ or UQ (48 characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    badgeColor: '#334155',
    networks: [
      {
        networkCode: 'XRPL',
        networkName: 'XRP Ledger (XRPL)',
        depositAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
        memo: '109482751',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.25,
        confirmations: '1 ledger · ~5 sec',
        addressHint: 'XRPL address starting with r (25–35 characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'TRX',
    name: 'TRON',
    badgeColor: '#DC2626',
    networks: [
      {
        networkCode: 'TRC20',
        networkName: 'TRON (TRC20)',
        depositAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.5,
        confirmations: '19 confirmations · ~1 min',
        addressHint: 'TRON address starting with T (34 characters)',
      },
    ],
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    badgeColor: '#475569',
    networks: [
      {
        networkCode: 'LTC',
        networkName: 'Litecoin (Native)',
        depositAddress: 'ltc1q2n9x7m3k8w4p5z6y9v2c4b7h8j3d5f0s9a6u4e',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '4 confirmations · ~8 min',
        addressHint: 'Litecoin address starting with ltc1, L, or M',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    badgeColor: '#B45309',
    networks: [
      {
        networkCode: 'DOGE',
        networkName: 'Dogecoin (Native)',
        depositAddress: 'D8vK7h4mW9pQ2rX6tZ3bN5cV8yL1jF4gH9s',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.4,
        confirmations: '6 confirmations · ~6 min',
        addressHint: 'Dogecoin address starting with D (34 characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    badgeColor: '#1D4ED8',
    networks: [
      {
        networkCode: 'ADA',
        networkName: 'Cardano (Native)',
        depositAddress: 'addr1q9x7k3m2p8w4z6y9v2c4b7h8j3d5f0s9a6u4e8w2r7t5y3m9p2',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.45,
        confirmations: '15 confirmations · ~5 min',
        addressHint: 'Cardano Shelley address starting with addr1',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    badgeColor: '#E11D48',
    networks: [
      {
        networkCode: 'AVAXC',
        networkName: 'Avalanche C-Chain',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.35,
        confirmations: '12 confirmations · ~15 sec',
        addressHint: 'AVAX C-Chain address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'BEP20',
        networkName: 'BNB Smart Chain (BEP20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.3,
        confirmations: '15 confirmations · ~45 sec',
        addressHint: 'BEP20 address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'POL',
    name: 'Polygon',
    badgeColor: '#7C3AED',
    networks: [
      {
        networkCode: 'POLYGON',
        networkName: 'Polygon POS',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.2,
        confirmations: '64 confirmations · ~1 min',
        addressHint: 'Polygon address starting with 0x (42 hex characters)',
      },
      {
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x4E8a2F19c8B5C41b21fC771a93B2C5f7c2b3190E',
        minDepositUsd: 100,
        minWithdrawUsd: 40,
        withdrawFeeUsd: 4.0,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
      },
    ],
  },
  {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    badgeColor: '#0F172A',
    networks: [
      {
        networkCode: 'XLM',
        networkName: 'Stellar Network',
        depositAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        memo: '48291047',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.15,
        confirmations: '1 ledger · ~5 sec',
        addressHint: 'Stellar public key starting with G (56 characters)',
      },
    ],
  },
];

export function getBinanceCoin(symbol: BinanceCoinSymbol): BinanceCoinConfig {
  return BINANCE_COINS.find((c) => c.symbol === symbol) ?? BINANCE_COINS[0];
}

export function getBinanceNetwork(
  symbol: BinanceCoinSymbol,
  networkCode: BinanceNetworkCode
): BinanceNetworkOption | undefined {
  const coin = BINANCE_COINS.find((c) => c.symbol === symbol);
  return coin?.networks.find((n) => n.networkCode === networkCode);
}

export function validateNetworkAddress(
  networkCode: BinanceNetworkCode,
  address: string
): string | null {
  const trimmed = address.trim();
  if (!trimmed) {
    return 'Enter a destination wallet address.';
  }

  switch (networkCode) {
    case 'TRC20':
      if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
        return 'Enter a valid TRON (TRC20) address starting with T (34 characters).';
      }
      return null;
    case 'BEP20':
    case 'ERC20':
    case 'BASE':
    case 'ARBITRUM':
    case 'POLYGON':
    case 'AVAXC':
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return `Enter a valid ${networkCode} address starting with 0x (42 hex characters).`;
      }
      return null;
    case 'BTC':
      if (!/^(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(trimmed)) {
        return 'Enter a valid Bitcoin address starting with bc1, 1, or 3.';
      }
      return null;
    case 'SOL':
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
        return 'Enter a valid Solana Base58 address (32–44 characters).';
      }
      return null;
    case 'TON':
      if (!/^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/.test(trimmed)) {
        return 'Enter a valid TON address starting with EQ or UQ (48 characters).';
      }
      return null;
    case 'XRPL':
      if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(trimmed)) {
        return 'Enter a valid XRP Ledger address starting with r.';
      }
      return null;
    case 'LTC':
      if (!/^(ltc1[a-z0-9]{30,64}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,34})$/.test(trimmed)) {
        return 'Enter a valid Litecoin address starting with ltc1, L, or M.';
      }
      return null;
    case 'DOGE':
      if (!/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(trimmed)) {
        return 'Enter a valid Dogecoin address starting with D (34 characters).';
      }
      return null;
    case 'ADA':
      if (!/^addr1[a-z0-9]{40,110}$/.test(trimmed)) {
        return 'Enter a valid Cardano address starting with addr1.';
      }
      return null;
    case 'XLM':
      if (!/^G[A-Z2-7]{55}$/.test(trimmed)) {
        return 'Enter a valid Stellar address starting with G (56 characters).';
      }
      return null;
    default:
      return 'Unsupported network selected.';
  }
}
