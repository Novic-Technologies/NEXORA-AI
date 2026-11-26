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
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 5.5,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
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
        networkCode: 'ERC20',
        networkName: 'Ethereum (ERC20)',
        depositAddress: '0x9B3a54D092f1e882A4F81d9C1b771C4e21F3b892',
        minDepositUsd: 100,
        minWithdrawUsd: 50,
        withdrawFeeUsd: 5.0,
        confirmations: '12 confirmations · ~3 min',
        addressHint: 'Ethereum address starting with 0x (42 hex characters)',
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
        networkCode: 'SOL',
        networkName: 'Solana',
        depositAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        minDepositUsd: 50,
        minWithdrawUsd: 20,
        withdrawFeeUsd: 0.5,
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
    symbol: 'SOL',
    name: 'Solana',
    badgeColor: '#0284C7',
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
    case 'XRPL':
      if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(trimmed)) {
        return 'Enter a valid XRP Ledger address starting with r.';
      }
      return null;
    default:
      return 'Unsupported network selected.';
  }
}
