import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Snowflake, 
  Flame, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sliders, 
  Check, 
  X, 
  Sparkles,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { VirtualCard, User } from '../types/banking';

interface CardsHubProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const CardsHub: React.FC<CardsHubProps> = ({ currentUser, onRefreshData }) => {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [revealCvv, setRevealCvv] = useState(false);
  const [revealPan, setRevealPan] = useState(false);

  // Issue Card Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [cardBrand, setCardBrand] = useState<'MASTERCARD' | 'VISA'>('MASTERCARD');
  const [cardType, setCardType] = useState<'VIRTUAL' | 'PHYSICAL'>('VIRTUAL');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCards();
  }, [currentUser.id]);

  const loadCards = async () => {
    try {
      const res = await api.getUserCards(currentUser.id);
      setCards(res.cards);
      if (res.cards.length > 0) {
        setSelectedCard(res.cards[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFreeze = async (cardId: string) => {
    try {
      const res = await api.toggleFreezeCard({ userId: currentUser.id, cardId });
      setCards(cards.map(c => c.id === cardId ? res.card : c));
      if (selectedCard?.id === cardId) {
        setSelectedCard(res.card);
      }
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.issueCard({
        userId: currentUser.id,
        brand: cardBrand,
        cardType,
        pin
      });

      setCards([res.card, ...cards]);
      setSelectedCard(res.card);
      setIsIssueModalOpen(false);
      setPin('');
      onRefreshData();

      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">ZUNO Virtual & Physical Cards</h2>
          </div>
          <p className="text-xs text-slate-500">Zero-dollar forex fees, 3D secure online payments, and instant in-app freeze controls.</p>
        </div>

        <button
          id="btn-issue-new-card"
          onClick={() => { setIsIssueModalOpen(true); setErrorMessage(''); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Request New Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-400 text-xs shadow-sm">
          No cards issued yet. Click "Request New Card" above to create your instant virtual card.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card Visualizer (Interactive Card) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {selectedCard && (
              <div className="w-full max-w-md">
                
                {/* 3D-styled Sleek Card Container */}
                <div className={`relative h-56 rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl overflow-hidden border transition-all duration-300 ${
                  selectedCard.status === 'FROZEN'
                    ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-500 opacity-75'
                    : selectedCard.brand === 'MASTERCARD'
                    ? 'bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-900 border-indigo-500/30'
                    : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 border-blue-500/30'
                }`}>
                  
                  {/* Decorative mesh */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Top row */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold tracking-widest text-base">ZUNO</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded">
                        {selectedCard.cardType}
                      </span>
                    </div>

                    {selectedCard.status === 'FROZEN' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-200 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        <Snowflake className="w-3 h-3 animate-spin" />
                        FROZEN
                      </span>
                    )}

                    <div className="font-bold italic text-sm tracking-wider">
                      {selectedCard.brand}
                    </div>
                  </div>

                  {/* EMV Chip & NFC */}
                  <div className="flex items-center gap-3 z-10">
                    <div className="w-10 h-7 rounded-md bg-amber-400 border border-amber-300 flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-600/40 rounded-xs" />
                    </div>
                    <span className="text-[10px] tracking-widest opacity-60">)))</span>
                  </div>

                  {/* Card Number */}
                  <div className="z-10 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold tracking-widest text-slate-100">
                      {revealPan ? selectedCard.fullPan.match(/.{1,4}/g)?.join(' ') : selectedCard.panMasked}
                    </span>
                    <button
                      onClick={() => setRevealPan(!revealPan)}
                      className="p-1 rounded text-slate-300 hover:text-white cursor-pointer"
                      title="Reveal Full PAN"
                    >
                      {revealPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Bottom details */}
                  <div className="flex items-end justify-between text-xs z-10">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider opacity-60">Cardholder</div>
                      <div className="font-bold tracking-wider">{selectedCard.cardholderName}</div>
                    </div>

                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider opacity-60">Expires</div>
                        <div className="font-mono font-bold">{selectedCard.expiryMonth}/{selectedCard.expiryYear}</div>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider opacity-60">CVV</div>
                        <div 
                          onClick={() => setRevealCvv(!revealCvv)} 
                          className="font-mono font-bold cursor-pointer text-emerald-400 hover:text-emerald-300"
                        >
                          {revealCvv ? selectedCard.cvv : '•••'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Controls Bar */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => handleToggleFreeze(selectedCard.id)}
                    className={`py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      selectedCard.status === 'FROZEN'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    {selectedCard.status === 'FROZEN' ? <Flame className="w-4 h-4 text-amber-500" /> : <Snowflake className="w-4 h-4 text-blue-500" />}
                    {selectedCard.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}
                  </button>

                  <button
                    onClick={() => setRevealCvv(!revealCvv)}
                    className="py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-4 h-4 text-blue-600" />
                    {revealCvv ? 'Hide Security CVV' : 'Reveal CVV (821)'}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Cards List & Limit Management */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Cards Collection</h3>
            <div className="space-y-3">
              {cards.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCard(c); setRevealPan(false); setRevealCvv(false); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCard?.id === c.id
                      ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                      c.brand === 'MASTERCARD' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {c.brand[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {c.brand} ({c.cardType})
                        {c.status === 'FROZEN' && (
                          <span className="text-[9px] bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 rounded font-bold">Frozen</span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{c.panMasked}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Daily Limit</div>
                    <div className="font-mono text-xs font-bold text-slate-900">₦{(c.dailyLimit ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedCard && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Spending Limits</span>
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Monthly Online Spend Limit</span>
                  <span className="font-mono text-slate-900 font-bold">₦{(selectedCard.monthlyLimit ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Daily POS / ATM Limit</span>
                  <span className="font-mono text-slate-900 font-bold">₦{(selectedCard.dailyLimit ?? 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  Protected by 3D-Secure 2.0 & ZUNO Automated Risk Shield.
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ISSUE CARD MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Request ZUNO Card</h3>
                <p className="text-xs text-slate-500">Instant digital issuance for global payments</p>
              </div>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card Form Factor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardType('VIRTUAL')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      cardType === 'VIRTUAL'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Virtual (Instant Online)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType('PHYSICAL')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      cardType === 'PHYSICAL'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Physical (Chip & PIN)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card Payment Network</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardBrand('MASTERCARD')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      cardBrand === 'MASTERCARD'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Mastercard World
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBrand('VISA')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      cardBrand === 'VISA'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Visa Infinite
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 4-Digit Transaction PIN <span className="text-slate-400 font-normal">(Demo: 1234)</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-center text-slate-900 tracking-widest font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Issue Instant {cardBrand} {cardType} Card
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
