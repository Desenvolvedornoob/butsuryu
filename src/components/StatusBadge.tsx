
import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { StatusType } from "@/types/user";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  reviewerName?: string;
  showReviewerInfo?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, reviewerName, showReviewerInfo = false }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: 'Pendente',
          classes: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Aprovado',
          classes: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Rejeitado',
          classes: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: 'Pendente',
          classes: 'bg-amber-50 text-amber-700 border-amber-200'
        };
    }
  };

  const { icon, label, classes } = getStatusConfig();

  return (
    <div className="flex flex-col gap-1">
      <span 
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          classes,
          className
        )}
      >
        {icon}
        {label}
      </span>
      {showReviewerInfo && reviewerName && status !== 'pending' && (
        <div className="text-xs text-gray-500">
          {status === 'approved' ? 'Aprovado' : 'Rejeitado'} por {reviewerName}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
