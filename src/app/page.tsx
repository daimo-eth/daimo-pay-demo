"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Address, getAddress, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { createConfig, useEnsAddress, WagmiProvider } from "wagmi";

// Create a Daimo Pay intent (= checkout, deposit, or other onchain action).
// The user will be able to complete this intent in a single transfer, any coin, any chain.
async function createIntent({
  apiKey,
  destAddr,
  chain,
  token,
  amount,
}: {
  apiKey: string;
  destAddr: Address;
  chain: number;
  token: string;
  amount: string;
}) {
  console.log(`Creating payment intent: ${amount} to ${destAddr}`);

  // Make the API call
  // Prod:  `https://pay.daimo.com/api/generate`
  const res = await fetch( `https://pay.stage.daimo.xyz/api/generate`, {
    method: "POST",
    headers: {
      "Idempotency-Key": "" + Math.random(),
      "Api-Key": apiKey,
    },
    body: JSON.stringify({
      intent: "Test",
      items: [
        {
          name: "Foo",
          description: "Bar",
          image: "https://picsum.photos/200",
        },
      ],
      recipient: {
        address: destAddr,
        amount,
        token,
        chain,
      },
    }),
  });

  console.log(`Response status`, res.status);
  const body = await res.json();
  console.log(`Response`, body);

  return body.url;
}

export const config = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});
const queryClient = new QueryClient();

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function HomeScreen() {
  const [apiKey, setApiKey] = useState("");
  const [destAddr, setDestAddr] = useState<Address | undefined>();
  const [link, setLink] = useState<string | undefined>();

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-sans">
      <main className="flex flex-col gap-6 items-center sm:items-start text-gray-900 w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Daimo Pay Demo</h1>
        <p className="mb-4">
          This is a demo app showing how to integrate Daimo Pay. For details{" "}
          <a
            href="https://paydocs.daimo.com"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            see our docs <ExternalLinkIcon />
          </a>
        </p>

        <ol className="list-none space-y-8 w-full">
          <Step num={1} disabled={!!link}>
            <EnterApiKey
              apiKey={apiKey}
              setApiKey={setApiKey}
              disabled={!!link}
            />
          </Step>
          <Step num={2} disabled={!!link}>
            <EnterDestination
              destAddr={destAddr}
              setDestAddr={setDestAddr}
              disabled={!!link}
            />
          </Step>
          <Step num={3} disabled={!!link}>
            <CreatePaymentIntent
              destAddr={destAddr}
              apiKey={apiKey}
              onCreate={setLink}
              disabled={!!link}
            />
          </Step>
          {link && (
            <Step num={4} checkmark>
              <IntentCreated link={link} />
            </Step>
          )}
        </ol>
      </main>
    </div>
  );
}

function Step({
  num,
  children,
  disabled,
  checkmark,
}: {
  num: number;
  children: React.ReactNode;
  disabled?: boolean;
  checkmark?: boolean;
}) {
  return (
    <li
      className={`flex flex-col sm:flex-row items-start gap-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {checkmark ? (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          num
        )}
      </div>
      <div className="w-full sm:flex-grow">{children}</div>
    </li>
  );
}

function EnterApiKey({
  apiKey,
  setApiKey,
  disabled,
}: {
  apiKey: string;
  setApiKey: (key: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Enter API Key</h2>
      <input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="daimopay-..."
        className="w-full p-2 border rounded"
        disabled={disabled}
      />
      <div className="h-2" />
      <TextLight>
        Don&apos;t have one yet? Use{" "}
        <span className="font-mono select-all">daimopay-demo</span> for testing
        only.
      </TextLight>
    </div>
  );
}

// Subcomponents
function EnterDestination({
  destAddr,
  setDestAddr,
  disabled,
}: {
  destAddr?: Address;
  setDestAddr: (addr?: Address) => void;
  disabled?: boolean;
}) {
  const [inputAddress, setInputAddress] = useState<string>(destAddr || "");
  const [addressStatus, setAddressStatus] = useState<
    "pending" | "valid" | "error"
  >("pending");

  const { data: ensAddress } = useEnsAddress({
    name: inputAddress,
    query: { enabled: inputAddress.includes(".") },
  });

  const onBlur = () => {
    if (ensAddress) {
      setDestAddr(ensAddress);
      setAddressStatus("valid");
    } else if (isAddress(inputAddress)) {
      setDestAddr(getAddress(inputAddress));
      setAddressStatus("valid");
    } else if (inputAddress === "") {
      setDestAddr(undefined);
      setAddressStatus("pending");
    } else {
      setDestAddr(undefined);
      setAddressStatus("error");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Enter Destination</h2>
      <div className="w-full flex gap-2">
        <div className="w-2/3">
          <Input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            onBlur={onBlur}
            placeholder="vitalik.eth"
            status={addressStatus}
            disabled={disabled}
          />
        </div>
        <div className="w-1/3">
          <select className="w-full p-2 border rounded" disabled>
            <option>USDC on Sepolia</option>
          </select>
        </div>
      </div>
      <div className="h-2" />
      <TextLight>
        Pay supports many coins, many chains, and arbitrary contract calls. See
        docs for details.
      </TextLight>
    </div>
  );
}

function CreatePaymentIntent({
  destAddr,
  apiKey,
  onCreate,
  disabled,
}: {
  destAddr?: Address;
  apiKey?: string;
  onCreate: (link: string) => void;
  disabled?: boolean;
}) {
  const [dollarInput, setDollarInput] = useState<string>("");
  const dollars = Number(dollarInput);
  const isDisabled =
    destAddr == null || !(dollars > 0) || apiKey == null || disabled;

  const chain = 11155111; // Sepolia
  const token = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
  const amount = "" + Math.floor(dollars * 1e6); // USDC units

  const handleCreateIntent = async () => {
    if (apiKey == null) throw new Error('Missing apiKey');
    if (destAddr == null) throw new Error('Missing destAddr');
    const link = await createIntent({ apiKey, destAddr, chain, token, amount });
    onCreate(link);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Enter Amount</h2>
      <input
        type="number"
        value={dollarInput}
        onChange={(e) => setDollarInput(e.target.value)}
        placeholder="1.23"
        className="w-full p-2 border rounded"
        disabled={disabled}
      />
      <div className="h-4" />
      <ButtonPrimary onClick={handleCreateIntent} disabled={isDisabled}>
        CREATE PAYMENT INTENT
      </ButtonPrimary>
    </div>
  );
}

function Input({
  status,
  disabled,
  ...props
}: {
  status: "pending" | "valid" | "error";
  disabled?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full">
      <input
        {...props}
        className={`w-full p-2 border rounded ${
          status === "error" ? "border-red-700" : ""
        }`}
        disabled={disabled}
      />
      {status === "valid" && (
        <svg
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}

function IntentCreated({ link }: { link: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Intent Created</h2>
      <p className="mt-2">
        <a
          href={link}
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          {link}
        </a>
      </p>
    </div>
  );
}

function ButtonPrimary({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-3 rounded font-semibold tracking-wide bg-green-600 text-white text-sm ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-green-700 active:bg-green-800"
      }`}
    >
      {children}
    </button>
  );
}

function TextLight({ children }: { children: React.ReactNode }) {
  return <p className="pl-1 text-sm text-gray-600">{children}</p>;
}

function ExternalLinkIcon() {
  return (
    <svg
      className="inline-block w-4 h-4 ml-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
