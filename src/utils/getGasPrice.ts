import { parseUnits } from '@ethersproject/units';
import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { provider } from './issueTokens';

export type PricesData = {
  safeLow: {
    maxPriorityFee: number, // 30.546032838,
    maxFee: number, // 201.020433986
  },
  standard: {
    maxPriorityFee: number, // 32.928849981,
    maxFee: number, // 203.403251129
  },
  fast: {
    maxPriorityFee: number, // 40.969618987,
    maxFee: number, // 211.444020135
  },
  estimatedBaseFee: number, // 170.474401148,
  blockTime: number, // 6,
  blockNumber: number, // 47540253
}


export const gasSpeed = ['safe', 'safeLow', 'low', 'std', 'standard', 'fast', 'fastest'] as const

export type GasPriceOptions = {
  speed?: typeof gasSpeed[number] | null,
  maxGasPrice?: number | null,
  minGasPrice?: number | null,
}

function fromSpeed(prices: PricesData, speed: typeof gasSpeed[number]): number {
  switch (speed) {
    case 'safe':
    case 'safeLow':
    case 'low':
      return Math.ceil(prices.safeLow.maxFee);

    case 'std':
    case 'standard':
      return Math.ceil(prices.standard.maxFee);

    case 'fast':
    case 'fastest':
      return Math.ceil(prices.fast.maxFee);
  }
}

export function parseGwei(value: number): BigNumber {
  return parseUnits(String(value), 'gwei')
}

export const MIN_MATIC_GAS_PRICE = parseGwei(30)

export async function getGasPrice(options: GasPriceOptions) {
  let gasPrice: BigNumberish;

  // Fetching data from the API
  const req = await fetch(`https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken`);
  const data = await req.json(); // Using the provided API response structure
  
  if (!data || data.status !== "1") {
    throw new Error("Failed to fetch gas prices");
  }
  
  // Assuming suggestBaseFee as the base fee and calculating maxFee based on gas price suggestions
  const prices: PricesData = {
    safeLow: {
      maxPriorityFee: parseFloat(data.result.SafeGasPrice),
      maxFee: parseFloat(data.result.SafeGasPrice) + parseFloat(data.result.suggestBaseFee),
    },
    standard: {
      maxPriorityFee: parseFloat(data.result.ProposeGasPrice),
      maxFee: parseFloat(data.result.ProposeGasPrice) + parseFloat(data.result.suggestBaseFee),
    },
    fast: {
      maxPriorityFee: parseFloat(data.result.FastGasPrice),
      maxFee: parseFloat(data.result.FastGasPrice) + parseFloat(data.result.suggestBaseFee),
    },
    estimatedBaseFee: parseFloat(data.result.suggestBaseFee),
    blockTime: 0, // Placeholder if not available in response
    blockNumber: parseInt(data.result.LastBlock),
  };

  
  const selectedSpeed = options.speed || 'standard'; // Default to 'standard' if not specified
  gasPrice = parseGwei(fromSpeed(prices, selectedSpeed));


  return gasPrice;
}
