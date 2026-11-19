import { useState } from 'react';
import type { AdminActionError } from './useAdminOperationFeedback';
import { setReferralStatus } from '../services/adminRepository';
import { OperationType, ReferralRecord } from '../../../types/admin';

export function useAdminReferrals({ onChanged, onError }: { onChanged: () => void; onError: AdminActionError }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSetReferralStatus = async (
    refRec: ReferralRecord,
    nextStatus: 'approved' | 'pending' | 'revoked'
  ) => {
    try {
      await setReferralStatus(refRec, nextStatus);
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `referrals/${refRec.id}`);
    }
  };

  const handleCopyRef = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return {
    copiedCode,
    handleSetReferralStatus,
    handleCopyRef
  };
}
