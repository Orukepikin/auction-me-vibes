'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

interface WalletData {
  balance: number
  totalEarnings: number
  totalSales: number
  pendingPayouts: number
  bankDetails: {
    bankName: string | null
    accountNumber: string | null
    accountName: string | null
  }
  recentTransactions: {
    id: string
    type: 'EARNING' | 'PAYOUT' | 'REFUND'
    amount: number
    description: string
    status: string
    createdAt: string
  }[]
}

const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank',
  'First City Monument Bank (FCMB)', 'Globus Bank', 'Guaranty Trust Bank (GTBank)',
  'Heritage Bank', 'Keystone Bank', 'Kuda Bank', 'Opay', 'Palmpay',
  'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank',
  'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank', 'Union Bank',
  'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank'
]

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  // Bank form
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchWallet()
    }
  }, [status])

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setWallet(data)
        setBankName(data.bankDetails.bankName || '')
        setAccountNumber(data.bankDetails.accountNumber || '')
        setAccountName(data.bankDetails.accountName || '')
      }
    } catch (error) {
      addToast('Failed to load wallet', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bankName || !accountNumber || !accountName) {
      addToast('Please fill all bank details', 'error')
      return
    }

    if (accountNumber.length !== 10) {
      addToast('Account number must be 10 digits', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/wallet/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountName }),
      })

      if (res.ok) {
        addToast('Bank details saved! ✓', 'success')
        setShowBankForm(false)
        fetchWallet()
      } else {
        const data = await res.json()
        addToast(data.error || 'Failed to save', 'error')
      }
    } catch (error) {
      addToast('Failed to save bank details', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseInt(withdrawAmount)

    if (!amount || amount < 1000) {
      addToast('Minimum withdrawal is ₦1,000', 'error')
      return
    }

    if (amount > (wallet?.balance || 0)) {
      addToast('Insufficient balance', 'error')
      return
    }

    if (!wallet?.bankDetails.accountNumber) {
      addToast('Please add bank details first', 'error')
      setShowWithdrawForm(false)
      setShowBankForm(true)
      return
    }

    setWithdrawing(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (res.ok) {
        addToast('Withdrawal request submitted! 🎉', 'success')
        setShowWithdrawForm(false)
        setWithdrawAmount('')
        fetchWallet()
      } else {
        addToast(data.error || 'Withdrawal failed', 'error')
      }
    } catch (error) {
      addToast('Withdrawal failed', 'error')
    } finally {
      setWithdrawing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">💰 Wallet</h1>
          <p className="text-gray-400 mb-8">Manage your earnings and payouts</p>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(wallet?.balance || 0)}
              </p>
              <Button 
                className="w-full mt-4" 
                onClick={() => setShowWithdrawForm(true)}
                disabled={(wallet?.balance || 0) < 1000}
              >
                Withdraw
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-purple-400">
                {formatCurrency(wallet?.totalEarnings || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                {wallet?.totalSales || 0} completed sales
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-1">Pending Payouts</p>
              <p className="text-3xl font-bold text-yellow-400">
                {formatCurrency(wallet?.pendingPayouts || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Processing...
              </p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">🏦 Bank Account</h2>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowBankForm(!showBankForm)}
              >
                {wallet?.bankDetails.accountNumber ? 'Edit' : 'Add Bank'}
              </Button>
            </div>

            {wallet?.bankDetails.accountNumber && !showBankForm ? (
              <div className="bg-dark-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Bank</p>
                    <p className="font-medium">{wallet.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account Number</p>
                    <p className="font-medium">
                      ****{wallet.bankDetails.accountNumber?.slice(-4)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400">Account Name</p>
                    <p className="font-medium">{wallet.bankDetails.accountName}</p>
                  </div>
                </div>
              </div>
            ) : showBankForm ? (
              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bank Name</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select your bank</option>
                    {NIGERIAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="0123456789"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{accountNumber.length}/10 digits</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowBankForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    Save Bank Details
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500">No bank account added yet. Add one to withdraw your earnings.</p>
            )}
          </div>

          {/* Transaction History */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">📜 Transaction History</h2>

            {wallet?.recentTransactions && wallet.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {wallet.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        tx.type === 'EARNING' ? 'bg-green-500/20' :
                        tx.type === 'PAYOUT' ? 'bg-blue-500/20' :
                        'bg-red-500/20'
                      }`}>
                        {tx.type === 'EARNING' ? '💰' : tx.type === 'PAYOUT' ? '🏦' : '↩️'}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'EARNING' ? 'text-green-400' :
                        tx.type === 'PAYOUT' ? 'text-blue-400' :
                        'text-red-400'
                      }`}>
                        {tx.type === 'EARNING' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className={`text-xs ${
                        tx.status === 'COMPLETED' ? 'text-green-400' :
                        tx.status === 'PENDING' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>

          {/* Withdraw Modal */}
          {showWithdrawForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-dark-900 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">💸 Withdraw Funds</h3>
                
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount (₦)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      min={1000}
                      max={wallet?.balance || 0}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500 text-xl"
                    />
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Min: ₦1,000</span>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(wallet?.balance || 0))}
                        className="text-purple-400 hover:underline"
                      >
                        Max: {formatCurrency(wallet?.balance || 0)}
                      </button>
                    </div>
                  </div>

                  <div className="bg-dark-800 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-2">Withdraw to:</p>
                    <p className="font-medium">{wallet?.bankDetails.bankName}</p>
                    <p className="text-gray-400">****{wallet?.bankDetails.accountNumber?.slice(-4)}</p>
                    <p className="text-sm text-gray-500">{wallet?.bankDetails.accountName}</p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-400">
                      ⚠️ Withdrawals are processed within 24-48 hours
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => setShowWithdrawForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" loading={withdrawing}>
                      Withdraw
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
