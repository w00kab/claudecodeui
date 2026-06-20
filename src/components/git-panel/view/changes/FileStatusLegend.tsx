import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import { getStatusBadgeClass } from '../../utils/gitPanelUtils';

type FileStatusLegendProps = {
  isMobile: boolean;
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  M: 'gitPanel.fileStatus.modified',
  A: 'gitPanel.fileStatus.added',
  D: 'gitPanel.fileStatus.deleted',
  U: 'gitPanel.fileStatus.untracked',
};

const LEGEND_ITEMS = ['M', 'A', 'D', 'U'] as const;

export default function FileStatusLegend({ isMobile }: FileStatusLegendProps) {
  const { t } = useTranslation('settings');
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return null;
  }

  return (
    <div className="border-b border-border/60">
      <button
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex w-full items-center justify-center gap-1 bg-muted/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <Info className="h-3 w-3" />
        <span>{t('gitPanel.fileStatus.legend')}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="bg-muted/30 px-4 py-3 text-sm">
          <div className="flex justify-center gap-6">
            {LEGEND_ITEMS.map((status) => (
              <span key={status} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${getStatusBadgeClass(status)}`}
                >
                  {status}
                </span>
                <span className="italic text-muted-foreground">{t(STATUS_LABEL_KEYS[status])}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
