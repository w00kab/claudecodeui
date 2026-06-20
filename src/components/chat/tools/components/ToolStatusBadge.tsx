import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';

export type ToolStatus = 'running' | 'completed' | 'error' | 'denied';

const STATUS_KEYS: Record<ToolStatus, string> = {
  running: 'toolStatus.running',
  completed: 'toolStatus.completed',
  error: 'toolStatus.error',
  denied: 'toolStatus.denied',
};

const STATUS_CLASSES: Record<ToolStatus, string> = {
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  denied: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

interface ToolStatusBadgeProps {
  status: ToolStatus;
  className?: string;
}

export function ToolStatusBadge({ status, className }: ToolStatusBadgeProps) {
  const { t } = useTranslation('chat');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-px text-[10px] font-medium',
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}
