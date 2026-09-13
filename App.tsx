/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { InvoiceScanner } from './components/InvoiceScanner';
import { ReconciliationArena } from './components/ReconciliationArena';
import { BankReconciliation } from './components/BankReconciliation';
import { AccountingLedger } from './components/AccountingLedger';
import { AiAssistant } from './components/AiAssistant';
import { STPSettingsModal } from './components/STPSettingsModal';
import {
  INITIAL_INVOICES,
  INITIAL_POS,
  INITIAL_GRNS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_JOURNAL_ENTRIES,
  DEFAULT_STP_CONFIG,
} from './data/mockData';
import { Invoice, JournalEntry, BankTransaction, STPConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'intake' | 'matching' | 'bank' | 'journal' | 'assistant'>('intake');
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_POS);
  const [goodsReceipts, setGoodsReceipts] = useState(INITIAL_GRNS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(INITIAL_BANK_TRANSACTIONS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice>(INITIAL_INVOICES[0]);
  const [stpConfig, setStpConfig] = useState<STPConfig>(DEFAULT_STP_CONFIG);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check health on load
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasGeminiKey) setHasGeminiKey(true);
      })
      .catch((e) => console.warn('Health check error:', e));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add newly uploaded/extracted invoice
  const handleAddNewInvoice = (newInv: Invoice) => {
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedInvoice(newInv);
    showToast(`Invoice ${newInv.invoiceNumber} extracted with ${newInv.extractionConfidence}% confidence.`);
  };

  // Switch to matching tab with chosen invoice
  const handleProceedToMatching = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setActiveTab('matching');
  };

  // Update invoice status manually or from dispute
  const handleUpdateInvoiceStatus = (invId: string, status: any, matchingStatus: any) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, status, matchingStatus } : i))
    );
    if (selectedInvoice.id === invId) {
      setSelectedInvoice((prev) => ({ ...prev, status, matchingStatus }));
    }
  };

  // Post an invoice to GL
  const handlePostToGL = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    // Check if already posted
    const alreadyPosted = journalEntries.some((je) => je.invoiceId === invoiceId);
    if (alreadyPosted) {
      showToast(`Invoice ${target.invoiceNumber} is already posted to GL.`);
      return;
    }

    const newJE: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: `JE-2025-00${journalEntries.length + 82}`,
      date: new Date().toISOString().split('T')[0],
      invoiceId: target.id,
      invoiceNumber: target.invoiceNumber,
      vendorName: target.vendorName,
      status: 'posted',
      postedAt: new Date().toISOString(),
      postedBy: 'AI Autopilot Agent (STP Engine v4.2)',
      erpReference: `NETSUITE-SYNC-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Balanced double-entry journal created for 3-way matched invoice ${target.invoiceNumber}.`,
      totalDebit: target.totalAmount,
      totalCredit: target.totalAmount,
      isBalanced: true,
      lines: [
        ...target.lineItems.map((li, idx) => ({
          id: `jl-deb-${idx}`,
          accountCode: li.glCode || '5100',
          accountName: li.glAccountName || 'General Operating Expense',
          debit: li.amount,
          credit: 0,
          description: li.description,
          costCenter: li.costCenter || 'CC-Corporate',
        })),
        ...(target.taxAmount > 0
          ? [
              {
                id: `jl-tax`,
                accountCode: '1450',
                accountName: 'Input Tax / VAT Receivable',
                debit: target.taxAmount,
                credit: 0,
                description: `State & Local Tax ${(target.taxRate * 100).toFixed(1)}%`,
                costCenter: 'Corporate Tax',
              },
            ]
          : []),
        {
          id: `jl-cred-ap`,
          accountCode: '2000',
          accountName: 'Accounts Payable (Trade)',
          debit: 0,
          credit: target.totalAmount,
          description: `AP Trade Liability - ${target.vendorName}`,
          costCenter: 'Corporate AP',
        },
      ],
    };

    setJournalEntries((prev) => [newJE, ...prev]);
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId ? { ...i, status: 'posted_to_gl', journalEntryId: newJE.id } : i
      )
    );
    if (selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => ({ ...prev, status: 'posted_to_gl', journalEntryId: newJE.id }));
    }

    showToast(`Invoice ${target.invoiceNumber} posted to GL (${newJE.entryNumber})!`);
  };

  const handleApproveInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'approved' } : i))
    );
    if (selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => ({ ...prev, status: 'approved' }));
    }
    showToast('Invoice approved by controller override.');
  };

  // Bank reconciliation
  const handleReconcileTransaction = (txId: string, invoiceId?: string) => {
    setBankTransactions((prev) =>
      prev.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              status: 'reconciled',
              reconciledAt: new Date().toISOString(),
            }
          : tx
      )
    );

    if (invoiceId) {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (inv) {
        // Create bank clearing journal entry (Debit 2000 AP, Credit 1010 Cash)
        const clearingJE: JournalEntry = {
          id: `je-bank-${Date.now()}`,
          entryNumber: `JE-PAY-00${journalEntries.length + 90}`,
          date: new Date().toISOString().split('T')[0],
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          vendorName: inv.vendorName,
          status: 'posted',
          postedAt: new Date().toISOString(),
          postedBy: 'Bank Clearing Reconciliation Robot',
          erpReference: `BANK-ACH-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Cleared invoice payment via Chase Main Operating feed.`,
          totalDebit: inv.totalAmount,
          totalCredit: inv.totalAmount,
          isBalanced: true,
          lines: [
            {
              id: 'jl-ap-clear',
              accountCode: '2000',
              accountName: 'Accounts Payable (Trade)',
              debit: inv.totalAmount,
              credit: 0,
              description: `Settle AP Liability - ${inv.vendorName}`,
              costCenter: 'Corporate AP',
            },
            {
              id: 'jl-cash-clear',
              accountCode: '1010',
              accountName: 'Operating Cash - Chase Main',
              debit: 0,
              credit: inv.totalAmount,
              description: `ACH/Wire Outflow - Ref ${inv.invoiceNumber}`,
              costCenter: 'Treasury',
            },
          ],
        };
        setJournalEntries((prev) => [clearingJE, ...prev]);
      }
    }

    showToast('Bank transaction cleared & reconciled against cash ledger.');
  };

  const handleAutoReconcileAll = () => {
    const matched = bankTransactions.filter((tx) => tx.status === 'matched');
    matched.forEach((m) => {
      handleReconcileTransaction(m.id, m.matchedInvoiceId);
    });
    showToast(`Successfully reconciled ${matched.length} bank transactions.`);
  };

  // Run autonomous STP batch
  const handleRunBatchSTP = () => {
    setIsProcessingBatch(true);
    setTimeout(() => {
      let newlyPostedCount = 0;
      invoices.forEach((inv) => {
        if (
          inv.status !== 'posted_to_gl' &&
          (inv.matchingStatus === 'exact_match' || inv.matchingStatus === 'pending') &&
          inv.extractionConfidence >= stpConfig.autoApproveConfidence
        ) {
          handlePostToGL(inv.id);
          newlyPostedCount++;
        }
      });
      setIsProcessingBatch(false);
      showToast(
        `Autonomous STP batch completed: ${newlyPostedCount} invoice(s) auto-approved & posted to General Ledger.`
      );
    }, 900);
  };

  const exceptionCount = invoices.filter(
    (inv) => inv.matchingStatus !== 'exact_match' && inv.status !== 'posted_to_gl'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-fade-in border border-indigo-400/40">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onRunBatchSTP={handleRunBatchSTP}
        onUploadClick={() => {
          setActiveTab('intake');
          setTimeout(() => {
            document.getElementById('btn-upload-invoice')?.click();
          }, 50);
        }}
        isProcessingBatch={isProcessingBatch}
        hasGeminiKey={hasGeminiKey}
        exceptionCount={exceptionCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Metrics Strip */}
        <MetricCards
          invoices={invoices}
          onFilterExceptions={() => setActiveTab('matching')}
        />

        {/* Tab 1: Invoice Ingestion & OCR Scanner */}
        {activeTab === 'intake' && (
          <InvoiceScanner
            invoices={invoices}
            selectedInvoice={selectedInvoice}
            purchaseOrders={purchaseOrders}
            goodsReceipts={goodsReceipts}
            tolerancePct={stpConfig.priceVarianceTolerancePct}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            onAddNewInvoice={handleAddNewInvoice}
            onProceedToMatching={handleProceedToMatching}
            onPostToGL={handlePostToGL}
          />
        )}

        {/* Tab 2: 3-Way PO Reconciliation Arena */}
        {activeTab === 'matching' && (
          <ReconciliationArena
            invoices={invoices}
            purchaseOrders={purchaseOrders}
            goodsReceipts={goodsReceipts}
            selectedInvoice={selectedInvoice}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            onApproveInvoice={handleApproveInvoice}
            onPostToGL={handlePostToGL}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          />
        )}

        {/* Tab 3: Bank Feed & Statement Matching */}
        {activeTab === 'bank' && (
          <BankReconciliation
            transactions={bankTransactions}
            invoices={invoices}
            onReconcileTransaction={handleReconcileTransaction}
            onAutoReconcileAll={handleAutoReconcileAll}
          />
        )}

        {/* Tab 4: General Ledger Journal & Double Entry */}
        {activeTab === 'journal' && (
          <AccountingLedger
            journalEntries={journalEntries}
            invoices={invoices}
            onPostNewJournalEntry={handlePostToGL}
          />
        )}

        {/* Tab 5: AI Accounting Copilot */}
        {activeTab === 'assistant' && (
          <AiAssistant
            invoices={invoices}
            selectedInvoice={selectedInvoice}
          />
        )}
      </main>

      {/* Straight-Through Processing Settings Modal */}
      <STPSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        config={stpConfig}
        onSaveConfig={(newCfg) => {
          setStpConfig(newCfg);
          showToast('Updated Straight-Through Processing policies.');
        }}
      />
    </div>
  );
}
