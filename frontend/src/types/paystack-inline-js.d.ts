declare module '@paystack/inline-js' {
  export interface PaystackTransaction {
    reference: string;
    status?: string;
    trans?: string;
    transaction?: string;
    message?: string;
    [key: string]: unknown;
  }

  export interface ResumeTransactionOptions {
    onSuccess?: (transaction: PaystackTransaction) => void;
    onCancel?: () => void;
    onError?: (error: { message?: string } & Record<string, unknown>) => void;
    onLoad?: (response: unknown) => void;
  }

  export default class PaystackPop {
    resumeTransaction(
      accessCode: string,
      options?: ResumeTransactionOptions,
    ): unknown;
    newTransaction(options: Record<string, unknown>): unknown;
  }
}
