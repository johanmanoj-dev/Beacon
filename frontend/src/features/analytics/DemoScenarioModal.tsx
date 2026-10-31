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
} from 'lucide-react';
import api from '../../services/api';
import { Button, Badge, Modal } from '../../components/ui';

export interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const res = await api.post('/analytics/seed-demo-data');
      setSeedStatus({
        success: true,
        message: res.data?.message || 'Database successfully seeded with demo dataset!',
      });
    } catch (err: any) {
      setSeedStatus({
        success: false,
        message: err?.message || 'Seeding failed. Verify MySQL connection on localhost:3306.',
      });
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
      desc: 'Sub-2-second executive KPIs, MRR revenue bar chart, status donut, and printable PDF invoices.',
      route: '/analytics',
      icon: TrendingUp,
      badge: 'Executive View',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>Hackathon Demonstration Master Navigator (Phase 4)</span>
        </div>
      }
      description="Interactive scenario guide covering all 7 Problem Statement demonstration requirements."
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-xs text-slate-500">
            Phase 4 Integration • Goutham Lead Seeder
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
      <div className="space-y-5 py-2">
        {/* Seed Feedback Banner */}
        {seedStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
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

        {/* Introduction Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-xs text-blue-950 space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-sm">
            <Database className="h-4 w-4 text-blue-600" />
            End-to-End Scenario Testing Environment
          </span>
          <p className="text-blue-900/80 leading-relaxed">
            Click <strong>"Seed Local MySQL DB"</strong> below to execute <code>seed.sql</code> against <code>localhost:3306</code>.
            Use the shortcuts below to step through all 7 evaluation scenes from the problem statement.
          </p>
        </div>

        {/* 7 Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.num}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
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
      </div>
    </Modal>
  );
};
