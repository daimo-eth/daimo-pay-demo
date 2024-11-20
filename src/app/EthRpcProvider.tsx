"use client";

import React from 'react';

import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DaimoPayProvider, getDefaultConfig } from '@daimo/pay';

const config = createConfig(
  getDefaultConfig({
    appName: 'Daimo Pay Demo',
  })
);

const queryClient = new QueryClient();

export function EthProvider ({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider debugMode>{children}</DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};