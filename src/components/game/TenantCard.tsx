import React from 'react';
import { Building, Ruler, DollarSign, Clock, Shield, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { tenantTypeLabels, creditRatingLabels, formatCurrency } from '@/data/mockData';
import type { Tenant } from '@/types';

interface TenantCardProps {
  tenant: Tenant;
  selected?: boolean;
  onClick?: () => void;
}

const creditRatingColors: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-yellow-500',
  C: 'bg-red-500',
};

export const TenantCard: React.FC<TenantCardProps> = ({ tenant, selected, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200',
        selected && 'ring-2 ring-accent-500 border-accent-500/50',
        onClick && 'hover:border-primary-500/50'
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{tenant.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {tenantTypeLabels[tenant.type]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">信用评级</span>
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-bold text-white',
                creditRatingColors[tenant.creditRating]
              )}
            >
              {creditRatingLabels[tenant.creditRating]}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">面积: {tenant.area}㎡</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">租金: {tenant.rentOffer}元/㎡</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">租期: {tenant.contractTerm}个月</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">押金: {formatCurrency(tenant.deposit)}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-sm text-gray-400">经营范围:</span>
          </div>
          <p className="text-sm text-gray-300 ml-6">{tenant.businessScope}</p>
          
          {tenant.specialRequirements && (
            <div className="mt-3 p-3 bg-accent-500/10 rounded-lg border border-accent-500/20">
              <span className="text-sm text-accent-400 font-medium">特殊要求: </span>
              <span className="text-sm text-gray-300">{tenant.specialRequirements}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default TenantCard;
