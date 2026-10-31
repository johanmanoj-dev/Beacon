import React, { useState } from 'react';
import { Percent, Tag } from 'lucide-react';
import { TaxRatesTab } from './TaxRatesTab';
import { DiscountsTab } from './DiscountsTab';

export const BillingConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'taxes' | 'discounts'>('discounts');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-[#E5DFD3] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2B4257] text-[#FAF7F0] shadow-sm">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#101E2B] tracking-tight">
              Taxes & Discount Rules
            </h1>
            <p className="text-sm text-[#5A6D80] mt-0.5">
              Governs fiscal pricing, automated GST calculation, and commercial promotions across quotes & recurring invoices.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-6 border-b border-[#E5DFD3]">
          <button
            onClick={() => setActiveTab('discounts')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'discounts'
                ? 'border-[#2B4257] text-[#2B4257]'
                : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
            }`}
          >
            <Tag className="h-4 w-4" />
            Promotional Discounts
          </button>

          <button
            onClick={() => setActiveTab('taxes')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'taxes'
                ? 'border-[#2B4257] text-[#2B4257]'
                : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
            }`}
          >
            <Percent className="h-4 w-4" />
            Statutory Tax Rates
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'taxes' ? <TaxRatesTab /> : <DiscountsTab />}
    </div>
  );
};
export default BillingConfigPage;
