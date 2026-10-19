import { db } from '../db/database';
import { authService } from './authService';
import { ledgerService } from './ledgerService';
import { 
  SupportedCurrency, 
  Wallet, 
  Transaction, 
  BusinessProfile, 
  PaymentLink, 
  ExchangeQuote, 
  InternationalReceivingDetails 
} from '../../src/types/banking';

export class MultiCurrencyService {
  // Exchange Rates Matrix against NGN (Mid-Market Benchmark)
  private readonly ratesToNgn: Record<SupportedCurrency, number> = {
    NGN: 1.0,
    USD: 1485.50,
    GBP: 1920.00,
    EUR: 1610.00
  };

  /**
   * Helper to resolve standard GAAP ledger liability account code by currency
   */
  public getCustomerLiabilityAccount(currency: SupportedCurrency | string): string {
    switch (currency) {
      case 'USD': return '2003-USD-CUST-LIABILITY';
      case 'GBP': return '2004-GBP-CUST-LIABILITY';
      case 'EUR': return '2005-EUR-CUST-LIABILITY';
      case 'NGN':
      default:
        return '2001-CUST-LIABILITY';
    }
  }

  /**
   * Helper to resolve partner banking rails settlement asset account code by currency
   */
  public getSettlementAccount(currency: SupportedCurrency | string): string {
    switch (currency) {
      case 'USD': return '1004-USD-SETTLEMENT';
      case 'GBP': return '1005-GBP-SETTLEMENT';
      case 'EUR': return '1006-EUR-SETTLEMENT';
      case 'NGN':
      default:
        return '1001-CASH-SETTLEMENT';
    }
  }

  /**
   * Get Live Exchange Rate Quote
   */
  public getExchangeRate(from: SupportedCurrency, to: SupportedCurrency): { rate: number; inverse: number } {
    if (from === to) return { rate: 1.0, inverse: 1.0 };
    const fromInNgn = this.ratesToNgn[from];
    const toInNgn = this.ratesToNgn[to];
    const rate = Number((fromInNgn / toInNgn).toFixed(4));
    const inverse = Number((1 / rate).toFixed(4));
    return { rate, inverse };
  }

  /**
   * Generate Guaranteed Exchange Rate Quote
   */
  public getQuote(params: { from: SupportedCurrency; to: SupportedCurrency; amount: number }): ExchangeQuote {
    const { from, to, amount } = params;
    if (amount <= 0) throw new Error('Conversion amount must be greater than zero.');
    
    const { rate, inverse } = this.getExchangeRate(from, to);
    
    // Transparent 0.5% fee margin (min ₦250 or $0.50)
    const feeRate = 0.005;
    const fee = Number(Math.max(from === 'NGN' ? 250 : 0.50, amount * feeRate).toFixed(2));
    const netSendAmount = Math.max(0, amount - fee);
    const toAmount = Number((netSendAmount * rate).toFixed(2));

    return {
      quoteId: `QTE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      fromCurrency: from,
      toCurrency: to,
      fromAmount: amount,
      toAmount,
      exchangeRate: rate,
      inverseRate: inverse,
      fee,
      feeCurrency: from,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
  }

  /**
   * Convert Currency Atomically between User Wallets
   */
  public convertCurrency(params: {
    userId: string;
    fromCurrency: SupportedCurrency;
    toCurrency: SupportedCurrency;
    amount: number;
    pin: string;
  }): { transaction: Transaction; fromWallet: Wallet; toWallet: Wallet } {
    const { userId, fromCurrency, toCurrency, amount, pin } = params;

    if (fromCurrency === toCurrency) throw new Error('Source and destination currencies cannot be identical.');
    if (amount <= 0) throw new Error('Conversion amount must be greater than zero.');

    // 1. PIN Validation
    if (!authService.verifyPin(userId, pin)) {
      throw new Error('Invalid 4-digit transaction PIN. (Demo PIN: 1234)');
    }

    const fromWallet = db.getCurrencyWallet(userId, fromCurrency);
    const toWallet = db.getCurrencyWallet(userId, toCurrency);

    if (fromWallet.availableBalance < amount) {
      const sym = fromCurrency === 'NGN' ? '₦' : fromCurrency === 'USD' ? '$' : fromCurrency === 'GBP' ? '£' : '€';
      throw new Error(`Insufficient ${fromCurrency} balance. Required: ${sym}${amount.toLocaleString()}, Available: ${sym}${fromWallet.availableBalance.toLocaleString()}`);
    }

    const quote = this.getQuote({ from: fromCurrency, to: toCurrency, amount });

    // 2. Atomic Balance Adjustment
    fromWallet.availableBalance = Number((fromWallet.availableBalance - amount).toFixed(2));
    fromWallet.ledgerBalance = Number((fromWallet.ledgerBalance - amount).toFixed(2));
    fromWallet.updatedAt = new Date().toISOString();

    toWallet.availableBalance = Number((toWallet.availableBalance + quote.toAmount).toFixed(2));
    toWallet.ledgerBalance = Number((toWallet.ledgerBalance + quote.toAmount).toFixed(2));
    toWallet.updatedAt = new Date().toISOString();

    db.setCurrencyWallet(userId, fromCurrency, fromWallet);
    db.setCurrencyWallet(userId, toCurrency, toWallet);

    // 3. Double-Entry General Ledger Journal Entry
    const ref = `ZUN-FX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `FX Swap: ${fromCurrency} ${amount} -> ${toCurrency} ${quote.toAmount} @ ${quote.exchangeRate}`,
      currency: fromCurrency,
      legs: [
        { accountCode: this.getCustomerLiabilityAccount(fromCurrency), type: 'DEBIT', amount },
        { accountCode: '4002-FX-REVENUE', type: 'CREDIT', amount: quote.fee },
        { accountCode: this.getSettlementAccount(fromCurrency), type: 'CREDIT', amount: Number((amount - quote.fee).toFixed(2)) }
      ]
    });

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'CURRENCY_EXCHANGE',
      amount,
      fee: quote.fee,
      totalDeducted: amount,
      currency: fromCurrency,
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: fromWallet.accountId,
      destinationAccount: toWallet.accountId,
      counterpartyName: `ZUNO FX Conversion Desk (${toCurrency})`,
      counterpartyBank: 'ZUNO Multi-Currency Vault',
      narration: `Converted ${fromCurrency} ${amount.toLocaleString()} to ${toCurrency} ${quote.toAmount.toLocaleString()} @ 1 ${fromCurrency} = ${quote.exchangeRate} ${toCurrency}`,
      category: 'TRANSFER',
      ledgerTransactionId: ledgerTx.id,
      metadata: {
        fromCurrency,
        toCurrency,
        rate: quote.exchangeRate,
        convertedAmount: quote.toAmount,
        quoteId: quote.quoteId
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    // 4. In-App Notification
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Currency Converted Successfully',
      message: `You converted ${fromCurrency} ${amount.toLocaleString()} to ${toCurrency} ${quote.toAmount.toLocaleString()}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { transaction: tx, fromWallet, toWallet };
  }

  /**
   * International Receiving Account Details
   * Partner rails for USD (CFSB), GBP (ClearBank), EUR (Banking Circle)
   */
  public getReceivingDetails(userId: string, currency: SupportedCurrency = 'USD'): InternationalReceivingDetails {
    const user = db.users.get(userId) || db.users.get('USR-882109')!;
    const biz = db.businessProfiles.get(userId);
    const beneficiaryName = biz ? biz.tradingName.toUpperCase() : `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`;
    const userSuffix = user.id.replace('USR-', '').slice(-6) || '882109';

    if (currency === 'USD') {
      return {
        currency: 'USD',
        currencyName: 'United States Dollar',
        symbol: '$',
        bankName: 'Community Federal Savings Bank (CFSB)',
        bankAddress: '89-16 Jamaica Ave, Woodhaven, NY 11421, USA',
        accountNumber: `982001${userSuffix}`,
        beneficiaryName,
        beneficiaryAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
        routingNumber: '026073150', // ACH
        wireRoutingNumber: '026073150', // Fedwire
        swiftBic: 'CFSBUS33XXX',
        eligibleNetworks: ['ACH Transfer (Direct Deposit)', 'Fedwire (Domestic Wire)', 'International SWIFT Wire'],
        depositFee: 'Zero / 0% ZUNO receiving fee',
        settlementSpeed: 'ACH: 1-2 business days; Wire: Same-day',
        paymentInstructions: [
          'Funds received in USD will remain 100% in USD. No forced or automatic conversion to NGN.',
          'Supported for payouts from Stripe, PayPal, Upwork, Deel, Fiverr, Amazon, and international clients.',
          'Only receive payments in your name or verified trading name.',
          'ACH transfers take 1-2 business days; Fedwire is credited within 2-4 hours during US banking hours.'
        ]
      };
    }

    if (currency === 'GBP') {
      return {
        currency: 'GBP',
        currencyName: 'British Pound Sterling',
        symbol: '£',
        bankName: 'ClearBank Limited (UK Rail Partner)',
        bankAddress: '133 Houndsditch, London EC3A 7BX, United Kingdom',
        accountNumber: `7849${userSuffix.slice(-4)}`,
        sortCode: '04-00-75',
        beneficiaryName,
        beneficiaryAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
        swiftBic: 'CLRBGB2LXXX',
        eligibleNetworks: ['Faster Payments (FPS - Instant)', 'BACS', 'CHAPS'],
        depositFee: 'Zero ZUNO receiving fee',
        settlementSpeed: 'Instant via Faster Payments (FPS)',
        paymentInstructions: [
          'Funds received in GBP are credited directly to your GBP balance without automatic conversion.',
          'Accepts UK domestic transfers via Faster Payments and direct corporate payouts.'
        ]
      };
    }

    if (currency === 'EUR') {
      return {
        currency: 'EUR',
        currencyName: 'Euro',
        symbol: '€',
        bankName: 'Banking Circle S.A. (SEPA Rails Partner)',
        bankAddress: '2 Boulevard de la Foire, L-1528 Luxembourg',
        accountNumber: `LU8937920048${userSuffix}`,
        iban: `LU893792004819${userSuffix}`,
        swiftBic: 'BCIRLULLXXX',
        beneficiaryName,
        beneficiaryAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
        eligibleNetworks: ['SEPA Instant Credit', 'SEPA Standard Transfer', 'SWIFT EUR'],
        depositFee: 'Zero ZUNO receiving fee',
        settlementSpeed: 'SEPA Instant: Under 10 seconds; Standard: 1 business day',
        paymentInstructions: [
          'Funds received in EUR are credited directly to your EUR balance without automatic conversion.',
          'Compliant with European Union SEPA Instant credit standards across 36 countries.'
        ]
      };
    }

    // Default NGN fallback
    const acc = Array.from(db.accounts.values()).find(a => a.userId === userId) || Array.from(db.accounts.values())[0];
    return {
      currency: 'NGN',
      currencyName: 'Nigerian Naira',
      symbol: '₦',
      bankName: acc ? acc.bankName : 'ZUNO Partner Bank (Providus MFB Rails)',
      bankAddress: 'Plot 54, Adetokunbo Ademola St, Victoria Island, Lagos',
      accountNumber: acc ? acc.accountNumber : '8012345678',
      beneficiaryName,
      beneficiaryAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
      eligibleNetworks: ['NIP (NIBSS Instant Payment)', 'Interbank Transfer'],
      depositFee: 'Zero fee',
      settlementSpeed: 'Instant',
      paymentInstructions: [
        'Instant NIBSS NIP interbank settlement from any Nigerian commercial or digital bank.'
      ]
    };
  }

  /**
   * Simulate Incoming International Payment (e.g. from Stripe, Deel, Upwork, Client Wire)
   * Guaranteed: NO automatic conversion to Naira. Credited directly to foreign currency wallet.
   */
  public simulateIncomingPayment(params: {
    userId: string;
    currency: SupportedCurrency;
    amount: number;
    senderName: string;
    senderBank?: string;
    paymentRail?: 'ACH' | 'WIRE' | 'SWIFT' | 'SEPA' | 'FPS';
    narration?: string;
  }): { transaction: Transaction; wallet: Wallet } {
    const { userId, currency, amount, senderName, senderBank, paymentRail, narration } = params;

    if (amount <= 0) throw new Error('Incoming payment amount must be positive.');

    const wallet = db.getCurrencyWallet(userId, currency);
    const rail = paymentRail || (currency === 'USD' ? 'ACH' : currency === 'GBP' ? 'FPS' : 'SEPA');
    const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

    // 1. Credit User's Target Currency Wallet Directly
    wallet.availableBalance = Number((wallet.availableBalance + amount).toFixed(2));
    wallet.ledgerBalance = Number((wallet.ledgerBalance + amount).toFixed(2));
    wallet.updatedAt = new Date().toISOString();
    db.setCurrencyWallet(userId, currency, wallet);

    // 2. Double-Entry Posting: Debit International Settlement Asset, Credit Customer Multi-Currency Liability
    const ref = `ZUN-INC-${currency}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Inward ${currency} ${rail} Remittance from ${senderName}`,
      currency,
      legs: [
        { accountCode: this.getSettlementAccount(currency), type: 'DEBIT', amount },
        { accountCode: this.getCustomerLiabilityAccount(currency), type: 'CREDIT', amount }
      ]
    });

    // 3. Create Transaction Record
    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'INTERNATIONAL_RECEIPT',
      amount,
      fee: 0,
      totalDeducted: amount,
      currency,
      status: 'SUCCESSFUL',
      direction: 'CREDIT',
      sourceAccount: `${rail}-${Math.floor(100000 + Math.random() * 900000)}`,
      destinationAccount: wallet.accountId,
      counterpartyName: senderName || 'International Client',
      counterpartyBank: senderBank || (currency === 'USD' ? 'JPMorgan Chase NY' : currency === 'GBP' ? 'Barclays UK' : 'Deutsche Bank AG'),
      narration: narration || `Inward ${currency} Payment via ${rail} (No NGN Conversion)`,
      category: 'TOPUP',
      ledgerTransactionId: ledgerTx.id,
      metadata: {
        currency,
        rail,
        senderName,
        senderBank,
        autoConverted: false
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    // 4. Dispatch Alert Notification
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: `International Payment Received (${currency})`,
      message: `You received ${sym}${amount.toLocaleString()} from ${senderName} via ${rail}. Credited directly to your ${currency} balance.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { transaction: tx, wallet };
  }

  /**
   * International Outward Transfer (Remittance to US, UK, EU, Ghana, Kenya, Canada, etc.)
   */
  public transferInternational(params: {
    userId: string;
    sourceCurrency: SupportedCurrency;
    destinationCountry: string;
    destinationCurrency: string;
    sendAmount: number;
    recipientName: string;
    recipientAccountOrIban: string;
    recipientBank: string;
    routingOrSwift?: string;
    narration?: string;
    pin: string;
  }): { transaction: Transaction; wallet: Wallet } {
    const {
      userId,
      sourceCurrency,
      destinationCountry,
      destinationCurrency,
      sendAmount,
      recipientName,
      recipientAccountOrIban,
      recipientBank,
      routingOrSwift,
      narration,
      pin
    } = params;

    if (sendAmount <= 0) throw new Error('Transfer amount must be strictly greater than zero.');

    // 1. PIN Validation
    if (!authService.verifyPin(userId, pin)) {
      throw new Error('Invalid 4-digit transaction PIN. (Demo PIN: 1234)');
    }

    // 2. Check Wallet Balance
    const wallet = db.getCurrencyWallet(userId, sourceCurrency);
    const fee = sourceCurrency === 'NGN' ? 1500 : sourceCurrency === 'USD' ? 5.00 : 4.00;
    const totalDeducted = Number((sendAmount + fee).toFixed(2));

    const sym = sourceCurrency === 'NGN' ? '₦' : sourceCurrency === 'USD' ? '$' : sourceCurrency === 'GBP' ? '£' : '€';
    if (wallet.availableBalance < totalDeducted) {
      throw new Error(`Insufficient ${sourceCurrency} balance. Total: ${sym}${totalDeducted.toLocaleString()} (Send: ${sym}${sendAmount.toLocaleString()} + Transfer Fee: ${sym}${fee.toLocaleString()}), Available: ${sym}${wallet.availableBalance.toLocaleString()}`);
    }

    // 3. KYC Limits Check
    const kyc = db.kycProfiles.get(userId);
    const tier = kyc?.tier || 'TIER_1';
    const maxDailyAllowedUsd = tier === 'TIER_1' ? 100 : tier === 'TIER_2' ? 1000 : tier === 'TIER_3' ? 10000 : 50000;
    const sendInUsd = sourceCurrency === 'USD' ? sendAmount : sendAmount / (this.ratesToNgn[sourceCurrency] / this.ratesToNgn.USD);

    if (sendInUsd > maxDailyAllowedUsd) {
      throw new Error(`Amount exceeds your ${tier} international sending limit of $${maxDailyAllowedUsd.toLocaleString()} equivalent. Please upgrade your KYC tier.`);
    }

    // 4. Calculate Payout Amount
    let fxRate = 1.0;
    if (sourceCurrency === 'NGN' && destinationCurrency === 'USD') fxRate = 1 / 1485.50;
    else if (sourceCurrency === 'NGN' && destinationCurrency === 'GBP') fxRate = 1 / 1920.00;
    else if (sourceCurrency === 'USD' && destinationCurrency === 'GHS') fxRate = 15.50;
    else if (sourceCurrency === 'USD' && destinationCurrency === 'KES') fxRate = 129.50;
    else if (sourceCurrency === 'USD' && destinationCurrency === 'EUR') fxRate = 0.92;
    else if (sourceCurrency === 'GBP' && destinationCurrency === 'EUR') fxRate = 1.19;
    else fxRate = 1.0;

    const payoutAmount = Number((sendAmount * fxRate).toFixed(2));

    // 5. Deduct from Source Wallet
    wallet.availableBalance = Number((wallet.availableBalance - totalDeducted).toFixed(2));
    wallet.ledgerBalance = Number((wallet.ledgerBalance - totalDeducted).toFixed(2));
    wallet.dailySpentToday = Number(((wallet.dailySpentToday || 0) + totalDeducted).toFixed(2));
    wallet.updatedAt = new Date().toISOString();
    db.setCurrencyWallet(userId, sourceCurrency, wallet);

    // 6. Double-Entry Posting
    const ref = `ZUN-INTL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Outward Remittance to ${recipientName} (${destinationCountry}) via Partner Rails`,
      currency: sourceCurrency,
      legs: [
        { accountCode: this.getCustomerLiabilityAccount(sourceCurrency), type: 'DEBIT', amount: totalDeducted },
        { accountCode: '4002-FX-REVENUE', type: 'CREDIT', amount: fee },
        { accountCode: this.getSettlementAccount(sourceCurrency), type: 'CREDIT', amount: sendAmount }
      ]
    });

    // 7. Transaction Record
    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'TRANSFER_INTERNATIONAL',
      amount: sendAmount,
      fee,
      totalDeducted,
      currency: sourceCurrency,
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: recipientAccountOrIban,
      counterpartyName: recipientName,
      counterpartyBank: `${recipientBank} (${destinationCountry})`,
      narration: narration || `International Transfer to ${recipientName}`,
      sessionReference: `INTL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'TRANSFER',
      ledgerTransactionId: ledgerTx.id,
      metadata: {
        destinationCountry,
        destinationCurrency,
        payoutAmount,
        fxRate,
        routingOrSwift,
        settlementRail: 'Swift / Local Clearing Partner'
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    // 8. Notification
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'International Transfer Dispatched',
      message: `₦${sendAmount.toLocaleString()} sent to ${recipientName} in ${destinationCountry}. Estimated payout: ${destinationCurrency} ${payoutAmount.toLocaleString()}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { transaction: tx, wallet };
  }

  // --- BUSINESS PROFILES & WORKSPACE ---

  public getBusinessProfile(userId: string): BusinessProfile | null {
    return db.businessProfiles.get(userId) || null;
  }

  public saveBusinessProfile(userId: string, data: Partial<BusinessProfile>): BusinessProfile {
    let existing = db.businessProfiles.get(userId);
    if (!existing) {
      existing = {
        id: `BIZ-${userId.replace('USR-', '')}`,
        userId,
        tradingName: data.tradingName || 'Zuno Merchant Enterprise',
        businessCategory: data.businessCategory || 'General Commercial Services',
        description: data.description || 'Verified merchant providing cross-border products and digital services.',
        registrationType: data.registrationType || 'UNREGISTERED_SOLE_TRADER',
        rcNumber: data.rcNumber || '',
        tin: data.tin || '',
        supportEmail: data.supportEmail || 'business@zunobank.ng',
        supportPhone: data.supportPhone || '+2348012345678',
        businessAddress: data.businessAddress || '14 Admiralty Way, Lekki Phase 1, Lagos',
        status: data.registrationType === 'CAC_LIMITED_COMPANY' ? 'VERIFIED_BUSINESS' : 'ACTIVE_UNVERIFIED',
        website: data.website || '',
        invoiceCount: 0,
        totalCollectedNgn: 0,
        totalCollectedUsd: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      existing = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      };
    }

    db.businessProfiles.set(userId, existing);
    return existing;
  }

  public getPaymentLinks(userId: string): PaymentLink[] {
    return Array.from(db.paymentLinks.values())
      .filter(l => l.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createPaymentLink(params: {
    userId: string;
    title: string;
    customerName: string;
    customerEmail?: string;
    amount: number;
    currency: SupportedCurrency;
    description?: string;
  }): PaymentLink {
    const { userId, title, customerName, customerEmail, amount, currency, description } = params;
    if (amount <= 0) throw new Error('Payment link amount must be greater than zero.');

    const biz = db.businessProfiles.get(userId);
    const linkId = `PLINK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ref = `INV-${Date.now()}`;

    const link: PaymentLink = {
      id: linkId,
      businessId: biz ? biz.id : `BIZ-${userId}`,
      userId,
      title: title || 'Professional Services Invoice',
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || '',
      amount,
      currency,
      description: description || 'Digital commercial payment request via ZUNO Instant Gateway',
      reference: ref,
      status: 'ACTIVE',
      shareUrl: `https://pay.zunobank.ng/pay/${ref}`,
      createdAt: new Date().toISOString()
    };

    db.paymentLinks.set(link.id, link);

    if (biz) {
      biz.invoiceCount = (biz.invoiceCount || 0) + 1;
      biz.updatedAt = new Date().toISOString();
      db.businessProfiles.set(userId, biz);
    }

    return link;
  }

  public payPaymentLink(linkId: string, payerName: string = 'International Customer', paymentMethod: string = 'Card / Direct Bank'): { link: PaymentLink; transaction: Transaction; alreadySettled?: boolean } {
    let link = db.paymentLinks.get(linkId);
    if (!link) {
      for (const l of db.paymentLinks.values()) {
        if (l.reference === linkId || l.id === linkId) {
          link = l;
          break;
        }
      }
    }
    if (!link) throw new Error('Payment link or invoice not found.');

    // Gracefully handle already settled invoices without throwing an unhandled API error
    if (link.status === 'PAID') {
      let existingTx: Transaction | undefined;
      for (const t of db.transactions.values()) {
        if (t.metadata?.paymentLinkId === link.id || t.metadata?.reference === link.reference) {
          existingTx = t;
          break;
        }
      }

      return {
        link,
        transaction: existingTx || ({
          id: `TXN-SETTLED-${link.id}`,
          reference: link.reference,
          userId: link.userId,
          type: 'BUSINESS_INVOICE_PAYMENT',
          amount: link.amount,
          fee: 0,
          totalDeducted: link.amount,
          currency: link.currency,
          status: 'SUCCESSFUL',
          direction: 'CREDIT',
          sourceAccount: 'ONLINE-CHECKOUT-GATEWAY',
          destinationAccount: `WALLET-${link.currency}`,
          counterpartyName: payerName || link.customerName || 'Payer',
          counterpartyBank: paymentMethod,
          narration: `Payment for Invoice ${link.reference}: ${link.title}`,
          category: 'TOPUP',
          createdAt: link.paidAt || link.createdAt,
          completedAt: link.paidAt || link.createdAt
        } as Transaction),
        alreadySettled: true
      };
    }

    // 1. Post to double-entry general ledger first to ensure financial integrity
    const ref = `ZUN-COL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Payment Link Settlement: ${link.title} from ${payerName}`,
      currency: link.currency,
      legs: [
        { accountCode: this.getSettlementAccount(link.currency), type: 'DEBIT', amount: link.amount },
        { accountCode: this.getCustomerLiabilityAccount(link.currency), type: 'CREDIT', amount: link.amount }
      ]
    });

    // 2. Mark link as PAID only after ledger validation succeeds
    link.status = 'PAID';
    link.paidAt = new Date().toISOString();
    link.paymentMethod = paymentMethod;
    db.paymentLinks.set(link.id, link);

    // 3. Credit business owner's currency wallet
    const wallet = db.getCurrencyWallet(link.userId, link.currency);
    wallet.availableBalance = Number((wallet.availableBalance + link.amount).toFixed(2));
    wallet.ledgerBalance = Number((wallet.ledgerBalance + link.amount).toFixed(2));
    wallet.updatedAt = new Date().toISOString();
    db.setCurrencyWallet(link.userId, link.currency, wallet);

    // 4. Update business profile statistics
    const biz = db.businessProfiles.get(link.userId);
    if (biz) {
      if (link.currency === 'NGN') {
        biz.totalCollectedNgn = (biz.totalCollectedNgn || 0) + link.amount;
      } else {
        biz.totalCollectedUsd = (biz.totalCollectedUsd || 0) + link.amount;
      }
      db.businessProfiles.set(link.userId, biz);
    }

    // 5. Create transaction record
    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId: link.userId,
      type: 'BUSINESS_INVOICE_PAYMENT',
      amount: link.amount,
      fee: 0,
      totalDeducted: link.amount,
      currency: link.currency,
      status: 'SUCCESSFUL',
      direction: 'CREDIT',
      sourceAccount: 'ONLINE-CHECKOUT-GATEWAY',
      destinationAccount: wallet.accountId,
      counterpartyName: payerName,
      counterpartyBank: paymentMethod,
      narration: `Payment for Invoice ${link.reference}: ${link.title}`,
      category: 'TOPUP',
      ledgerTransactionId: ledgerTx.id,
      metadata: {
        paymentLinkId: link.id,
        reference: link.reference,
        customerName: payerName
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId: link.userId,
      title: 'Invoice Payment Received',
      message: `Your payment link "${link.title}" was paid (${link.currency} ${link.amount.toLocaleString()}) by ${payerName}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { link, transaction: tx, alreadySettled: false };
  }
}

export const multiCurrencyService = new MultiCurrencyService();
