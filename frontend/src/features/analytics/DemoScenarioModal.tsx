import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  Receipt,
  CreditCard,
  TrendingUp,
  Package,
  Clock,
  Mic,
  Award,
} from 'lucide-react';
import api from '../../services/api';
import { Button, Badge, Modal, useToast } from '../../components/ui';

export interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'PITCH'>('SCENARIOS');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const res = await api.post('/analytics/seed-demo-data');
      const msg = res.data?.message || 'Database successfully seeded with demo dataset!';
      setSeedStatus({
        success: true,
        message: msg,
      });
      showToast('MySQL database seeded with full 7-scene dataset!', 'success');
    } catch (err: any) {
      const errMsg = err?.message || 'Seeding failed. Verify MySQL connection on localhost:3306.';
      setSeedStatus({
        success: false,
        message: errMsg,
      });
      showToast(errMsg, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const scenarios = [
    {
      num: 1,
      title: 'Customer Onboarding & Security Compliance',
      desc: 'Live password strength validator, tenant isolation, and RBAC authentication.',
      route: '/register',
      icon: Shield,
      badge: 'Auth & RBAC',
    },
    {
      num: 2,
      title: 'Product Variants & Dynamic Adjustments',
      desc: 'Cloud ERP Software with Brand: Odoo variant adding +$560 to base price ($1560 total).',
      route: '/catalogue',
      icon: Package,
      badge: 'Catalogue',
    },
    {
      num: 3,
      title: 'Quotation to Subscription Conversion',
      desc: 'Quotation builder, line item taxes, and atomic 1-click subscription activation.',
      route: '/subscriptions',
      icon: Layers,
      badge: 'Subscriptions',
    },
    {
      num: 4,
      title: 'Billing Engine & Idempotency',
      desc: 'Automated billing run, immutable line item pricing snapshots, zero duplicate invoice guarantee.',
      route: '/invoices',
      icon: Receipt,
      badge: 'Billing Engine',
    },
    {
      num: 5,
      title: 'Promotional Volume Discounts',
      desc: 'Tiered 10% volume discount auto-applied to invoices meeting 5-seat minimum threshold.',
      route: '/rules',
      icon: Sparkles,
      badge: 'Discount Rules',
    },
    {
      num: 6,
      title: 'Dual Payment Processing',
      desc: 'Staff manual UPI payment recording + customer self-service simulated gateway modal.',
      route: '/portal',
      icon: CreditCard,
      badge: 'Dual Payments',
    },
    {
      num: 7,
      title: 'Finance Lead Real-Time Analytics',
      desc: 'Sub-200ms executive KPIs, MRR revenue bar chart, status donut, and printable PDF invoices.',
      route: '/analytics',
      icon: TrendingUp,
      badge: 'Executive View',
    },
  ];

  const pitchSections = [
    {
      timing: '0:00 - 0:45',
      title: 'The Hook: From Spreadsheet Chaos to Predictable Recurring Revenue',
      talkingPoints: [
        'Before Brightloop, subscription billing relied on disconnected spreadsheets, missed billing cycles, and manual errors.',
        'Brightloop solves this with a normalized MySQL database, zero cloud BaaS lock-in, and strict RBAC isolation.',
      ],
      icon: Mic,
    },
    {
      timing: '0:45 - 1:45',
      title: 'Scenes 1 & 2: Compliant Onboarding & Dynamic Variant Pricing',
      talkingPoints: [
        'Demonstrate client-side regex checklist requiring >8 chars, uppercase, and special chars.',
        'Show catalog variant logic: "Brand: Odoo" automatically adds +$560 onto $1000 base, recalculating effective unit price to $1560 with zero hardcoding.',
      ],
      icon: Package,
    },
    {
      timing: '1:45 - 2:45',
      title: 'Scenes 3 & 4: Instant Conversion & Strict Billing Idempotency',
      talkingPoints: [
        'Show 1-click quotation conversion advancing quotation status and issuing atomic SUB-2026-XXXX.',
        'Trigger recurring billing and then trigger it again: prove zero duplicate invoices are created due to composite unique constraint (subscription_id, period_start, period_end).',
      ],
      icon: Receipt,
    },
    {
      timing: '2:45 - 3:45',
      title: 'Scenes 5 & 6: Automated Tiered Discounts & Dual Payments',
      talkingPoints: [
        'Display 10% volume discount auto-applied once seat threshold >= 5 is reached.',
        'Show staff recording a manual $500 UPI payment (balance drops to $1060), followed by customer logging into self-service portal to settle the rest via simulated gateway.',
      ],
      icon: CreditCard,
    },
    {
      timing: '3:45 - 4:45',
      title: 'Scene 7: Real-Time Executive KPIs & Printable Invoices',
      talkingPoints: [
        'Open Finance Lead Dashboard: sub-200ms queries for MRR, active subscription retention, receivables aging.',
        'Open official print-ready PDF invoice with Brightloop branding, tax breakdown, and snapshot guarantee.',
      ],
      icon: TrendingUp,
    },
    {
      timing: '4:45 - 5:00',
      title: 'Closing & Judge Q&A Defense',
      talkingPoints: [
        'Technical Highlights: Java 17 / Spring Boot backend, local MySQL with HikariCP, React 19 + TypeScript frontend.',
        'Financial Integrity: Strict BigDecimal calculations, zero floating-point precision drift.',
      ],
      icon: Award,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>Hackathon Demo Master Navigator & Pitch Rehearsal</span>
        </div>
      }
      description="Interactive scenario guide covering all 7 Problem Statement demonstration requirements and judge pitch script."
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-xs text-slate-500">
            Phase 5 Final Polish • Goutham Lead Presenter
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDatabase}
              isLoading={isSeeding}
              leftIcon={<Database className="h-4 w-4 text-blue-600" />}
            >
              Seed Local MySQL DB
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close Guide
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'SCENARIOS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            7 Demonstration Scenes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PITCH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'PITCH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            5-Minute Judge Pitch Script
          </button>
        </div>

        {/* Seed Feedback Banner */}
        {seedStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              seedStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {seedStatus.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{seedStatus.message}</span>
          </div>
        )}

        {activeTab === 'SCENARIOS' ? (
          <>
            {/* Introduction Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-xs text-blue-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <Database className="h-3.5 w-3.5 text-blue-600" />
                End-to-End Scenario Testing Environment
              </span>
              <p className="text-blue-900/80 leading-relaxed text-[11px]">
                Click <strong>"Seed Local MySQL DB"</strong> below to execute <code>seed.sql</code> against <code>localhost:3306</code>.
                Use the shortcuts below to step through all 7 evaluation scenes from the problem statement.
              </p>
            </div>

            {/* 7 Scenario Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={sc.num}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                          {sc.num}
                        </span>
                        <Icon className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-900 leading-snug">
                          {sc.title}
                        </span>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {sc.badge}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {sc.desc}
                    </p>

                    <div className="pt-1 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(sc.route);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
                      >
                        Open View <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Pitch Rehearsal Script Tab */
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>5-Minute Delivery Target:</strong> Keep demonstrations crisp, emphasize technical requirements, and highlight zero BaaS dependencies.
              </span>
            </div>

            <div className="space-y-2.5">
              {pitchSections.map((sec, idx) => {
                const SecIcon = sec.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <SecIcon className="h-3.5 w-3.5 text-blue-600" />
                        {sec.title}
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {sec.timing}
                      </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                      {sec.talkingPoints.map((tp, pIdx) => (
                        <li key={pIdx}>{tp}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
