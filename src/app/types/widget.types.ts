export interface ChartBar { label: string; value: number; }

export interface ChatWidget {
  id: string;
  widgetType: 'chart' | 'table' | 'dataset' | 'document' | 'file' | 'asset';
  title: string;
  description: string;
  assetType: 'data' | 'tool' | 'model' | 'report' | 'pdf' | 'file';
  chartBars?: ChartBar[];
  tableHeaders?: string[];
  tableRows?: (string | number)[][];
  metaBadges?: string[];
  docExcerpt?: string;
  fileExt?: string;
  fileSize?: string;
  displayType?: string;
  rating?: string;
  audience?: string;
  users?: string;
  downloads?: string;
  slug?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  ext: string;
  status: 'loading' | 'success';
}
