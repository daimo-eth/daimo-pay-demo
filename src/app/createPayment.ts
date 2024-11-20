import { Address } from "viem";

/** Create a Daimo Pay payment (= checkout, deposit, or other onchain action). */
export interface Payment {
  id: string;
  url: string;
}

/**
 * Create a Daimo Pay payment. The user will be able to complete this payment in a single transfer, any coin, any chain.
 */
export async function createPayment({
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
}): Promise<Payment> {
  console.log(`Creating payment: ${amount} to ${destAddr}`);

  // Make the API call
  const apiUrl =
    process.env.NEXT_PUBLIC_PAY_API_URL || `https://pay.daimo.com/api`;
  const res = await fetch(`${apiUrl}/generate`, {
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
  if (res.status < 200 || res.status >= 300) {
    console.log(await res.text());
    throw new Error(res.statusText);
  }

  const body = await res.json();
  console.log(`Response`, body);
  return body as Payment;
}
