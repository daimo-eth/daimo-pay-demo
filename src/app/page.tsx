"use client";

import { DaimoPayButton } from "@daimo/pay";
import { useState } from "react";
import { Address, getAddress, isAddress } from "viem";
import { useEnsAddress } from "wagmi";
import { createPayment, Payment } from "./createPayment";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [destAddr, setDestAddr] = useState<Address>();
  const [payment, setPayment] = useState<Payment>();

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
          <Step num={1} disabled={payment != null}>
            <EnterApiKey
              apiKey={apiKey}
              setApiKey={setApiKey}
              disabled={payment != null}
            />
          </Step>
          <Step num={2} disabled={payment != null}>
            <EnterDestination
              destAddr={destAddr}
              setDestAddr={setDestAddr}
              disabled={payment != null}
            />
          </Step>
          <Step num={3} disabled={payment != null}>
            <CreatePaymentIntent
              destAddr={destAddr}
              apiKey={apiKey}
              onCreate={setPayment}
              disabled={payment != null}
            />
          </Step>
          {payment && (
            <Step num={4} checkmark>
              <PaymentDisplay payment={payment} />
            </Step>
          )}
        </ol>
      </main>
    </div>
  );
}

/** A step on the checklist. */
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
        only.{" "}
        <a
          className="text-blue-600 hover:underline"
          target="_blank"
          href="https://noteforms.com/forms/daimo-pay-early-access-absckg"
        >
          Sign up for an API key here.
        </a>
      </TextLight>
    </div>
  );
}

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
          <select className="w-full p-2 border rounded h-full" disabled>
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
  onCreate: (payment: Payment) => void;
  disabled?: boolean;
}) {
  const [dollarInput, setDollarInput] = useState<string>("");
  const dollars = Number(dollarInput);
  const isDisabled =
    destAddr == null || !(dollars > 0) || apiKey == null || disabled;

  const chain = 11155111; // Sepolia
  const token = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
  const amount = "" + Math.floor(dollars * 1e6); // USDC units

  const handleCreatePayment = async () => {
    if (apiKey == null) throw new Error("Missing apiKey");
    if (destAddr == null) throw new Error("Missing destAddr");
    const payment = await createPayment({
      apiKey,
      destAddr,
      chain,
      token,
      amount,
    });
    onCreate(payment);
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
      <ButtonPrimary onClick={handleCreatePayment} disabled={isDisabled}>
        CREATE PAYMENT
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

function PaymentDisplay({ payment }: { payment: Payment }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Payment Created</h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="mb-2 overflow-hidden">
          <h3 className="text-lg font-semibold mb-1">External Link Flow</h3>
          <div className="py-2 overflow-hidden whitespace-nowrap text-ellipsis">
          <a
            href={payment.url}
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            {payment.url}
          </a></div>
        </div>
        <div className="mb-2">
          <h3 className="text-lg font-semibold mb-1">Embedded Flow</h3>
          <DaimoPayButton payId={payment.id} theme="soft" />
        </div>
      </div>
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
      className="inline-block w-4 h-4 relative top-[-2px]"
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
