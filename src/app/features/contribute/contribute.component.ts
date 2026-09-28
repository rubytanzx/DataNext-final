import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { PromptBarComponent } from '../../shared/ui/prompt-bar/prompt-bar.component';
import { PrimaryBtnDirective } from '../../shared/ui/primary-btn/primary-btn.directive';
import { ChipSelectComponent } from '../../shared/ui/chip-select/chip-select.component';
import { GeoSelectComponent } from '../../shared/ui/geo-select/geo-select.component';
import { AIReasoningLoaderComponent } from '../../shared/ui/loaders/ai-reasoning-loader/ai-reasoning-loader.component';
import { ChatService } from '../../services/chat.service';

type ConvStep = 'await-asset' | 'await-proceed' | 'await-form' | 'large-dataset' | 'done';

interface ChatMsg {
  role: 'user' | 'assistant';
  text?: string;
  showSimilar?: boolean;
  showForm?: boolean;
  showLargeDatasetForm?: boolean;
  showSuccess?: boolean;
}

interface ContributeForm {
  title: string;
  type: string;
  description: string;
  departments: string[];
  contact: string;
  access: string;
  format: string;
  dataSize: string;
  rowCount: string;
  sectorGroup: string;
  geoCoverage: string[];
  timePeriod: string;
  updateFreq: string;
  themes: string[];
}

const DEPT_OPTIONS = [
  'ADBI', 'AFNR', 'BPMSD', 'CCSD', 'CSD',  'CWRD', 'EARD', 'ERDI',
  'ESO',  'FSO',  'ITD',   'OAG',  'OAI',  'OGC',  'OOMP', 'OOP',
  'OPEC', 'OPR',  'OSEC',  'OSFG', 'PARD', 'PPFD', 'PSOD', 'SARD',
  'SERD', 'SPD',  'TSO',   'WUDO',
];

const DEPT_LABELS: Record<string, string> = {
  'ADBI':  'ADB Institute',
  'AFNR':  'Agriculture, Food, Nature, and Rural Development Sector Office',
  'BPMSD': 'Budget, Personnel, and Management Systems Department',
  'CCSD':  'Climate Change and Sustainable Development Department',
  'CSD':   'Corporate Services Department',
  'CWRD':  'Central and West Asia Department',
  'EARD':  'East Asia Department',
  'ERDI':  'Economic Research and Development Impact Department',
  'ESO':   'Energy Sector Office',
  'FSO':   'Finance Sector Office',
  'ITD':   'Information Technology Department',
  'OAG':   'Office of the Auditor General',
  'OAI':   'Office of Anticorruption and Integrity',
  'OGC':   'Office of the General Counsel',
  'OOMP':  'Office of the Ombudsperson',
  'OOP':   'Office of the President',
  'OPEC':  'Office of Professional Ethics and Conduct',
  'OPR':   'Office of Public Relations',
  'OSEC':  'Office of the Secretary',
  'OSFG':  'Office of Safeguards',
  'PARD':  'Pacific Department',
  'PPFD':  'Procurement, Portfolio, and Financial Management Department',
  'PSOD':  'Private Sector Operations Department',
  'SARD':  'South Asia Department',
  'SERD':  'Southeast Asia Department',
  'SPD':   'Strategy, Policy, and Partnerships Department',
  'TSO':   'Transport Sector Office',
  'WUDO':  'Water and Urban Development Sector Office',
};

const THEME_OPTIONS = [
  'Agriculture', 'Air Quality', 'Biodiversity', 'Clean Energy', 'Climate',
  'Connectivity', 'Disaster Risk', 'Education', 'Environment', 'Finance',
  'Food Security', 'Gender', 'Governance', 'Health', 'Infrastructure',
  'Innovation', 'Labor', 'Poverty', 'Private Sector', 'Rural Development',
  'SDG', 'Social Protection', 'Trade', 'Transport', 'Urban', 'Water & Sanitation',
];


interface MockSubmission {
  status: 'review' | 'published';
  submittedAt: string;
  form: ContributeForm;
  conversation: ChatMsg[];
}

const MOCK_SUBMISSIONS: Record<string, MockSubmission> = {
  c1: {
    status: 'published',
    submittedAt: 'Jan 2026',
    form: {
      title: 'ASEAN Urban Water Quality Index', type: 'Dataset',
      description: 'Composite monitoring dataset tracking urban water quality across ASEAN member states — turbidity, pH, dissolved oxygen, and contamination indicators from municipal systems in 47 cities.',
      departments: ['SDCC'], contact: 'data.products@adb.org', access: 'Open Access',
      format: 'Parquet / CSV', dataSize: '2.3 GB', rowCount: '4.1M',
      sectorGroup: 'Climate & Environment', geoCoverage: ['Southeast Asia'],
      timePeriod: '2010–2025', updateFreq: 'Monthly',
      themes: ['Water & Sanitation', 'Climate', 'Urban'],
    },
    conversation: [
      { role: 'assistant', text: "Hi! I'll help you contribute a new asset to DataNext. What would you like to onboard? Describe what it is, what it contains, and how it's used." },
      { role: 'user', text: 'I have a water quality monitoring dataset covering ASEAN urban areas — turbidity, pH, dissolved oxygen, and contamination indicators from 47 municipal systems. Monthly updates from 2010 to present.' },
      { role: 'assistant', text: 'Thanks for sharing! We already have a few assets that cover similar ground. Take a look — you may find what you need is already available:', showSimilar: true },
      { role: 'user', text: "The dataset I'm contributing is more granular and includes additional contamination indicators not in these. I'd like to proceed." },
      { role: 'assistant', text: 'Great! Please fill in the details below. Fields marked * are required — Format, Size, and Rows will auto-populate when you attach the asset file.', showForm: true },
      { role: 'assistant', text: 'Your asset "ASEAN Urban Water Quality Index" has been submitted for review. The data governance team will reach out to data.products@adb.org within 2–3 business days. You\'ll receive a notification once it\'s approved and live on DataNext. Got another asset to contribute? Just describe it below.', showSuccess: true },
    ],
  },
  c2: {
    status: 'published',
    submittedAt: 'Nov 2025',
    form: {
      title: 'Southeast Asia Infrastructure Index', type: 'Dataset',
      description: 'Composite index measuring infrastructure quality, investment flows, and connectivity across ASEAN member states — covering roads, ports, energy grids, and digital infrastructure.',
      departments: ['SERD'], contact: 'infra-data@adb.org', access: 'ADB Only',
      format: 'CSV', dataSize: '840 MB', rowCount: '1.2M',
      sectorGroup: 'Transport', geoCoverage: ['Southeast Asia'],
      timePeriod: '2015–2025', updateFreq: 'Annual',
      themes: ['Infrastructure', 'Connectivity', 'Transport'],
    },
    conversation: [
      { role: 'assistant', text: "Hi! I'll help you contribute a new asset to DataNext. What would you like to onboard? Describe what it is, what it contains, and how it's used." },
      { role: 'user', text: "I'd like to submit the Southeast Asia Infrastructure Index — a composite dataset measuring infrastructure quality and connectivity across ASEAN member states covering roads, ports, energy, and digital infrastructure." },
      { role: 'assistant', text: 'I found a couple of assets already in DataNext worth reviewing before we proceed:', showSimilar: true },
      { role: 'user', text: "Mine focuses specifically on ASEAN infrastructure quality benchmarks — these are different. I'd like to proceed." },
      { role: 'assistant', text: 'Got it! Please complete the form below.', showForm: true },
      { role: 'assistant', text: 'Your asset "Southeast Asia Infrastructure Index" has been submitted for review. The data governance team will reach out to infra-data@adb.org within 2–3 business days. You\'ll receive a notification once it\'s approved and live on DataNext.', showSuccess: true },
    ],
  },
  c3: {
    status: 'review',
    submittedAt: 'Mar 2026',
    form: {
      title: 'Climate Finance Tracker API', type: 'API',
      description: "Programmatic access to climate finance commitments, disbursements, and project pipelines across ADB's developing member countries — covering funding sources, disbursement timelines, and sectoral breakdowns.",
      departments: ['CTL', 'CCSD'], contact: 'climate-finance@adb.org', access: 'ADB Only',
      format: 'JSON / REST', dataSize: '—', rowCount: '—',
      sectorGroup: 'Climate & Environment',
      geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
      timePeriod: '2019–present', updateFreq: 'Real-time',
      themes: ['Climate', 'Finance', 'Environment'],
    },
    conversation: [
      { role: 'assistant', text: "Hi! I'll help you contribute a new asset to DataNext. What would you like to onboard? Describe what it is, what it contains, and how it's used." },
      { role: 'user', text: "I want to contribute an API for tracking climate finance commitments and disbursements across ADB's DMCs — programmatic access to project pipelines, funding sources, and disbursement timelines." },
      { role: 'assistant', text: "This looks fairly unique — I didn't find any existing assets that overlap significantly. Let's get it onboarded. Please fill in the details below:", showForm: true },
      { role: 'assistant', text: 'Your asset "Climate Finance Tracker API" has been submitted for review. The data governance team will reach out to climate-finance@adb.org within 2–3 business days. You\'ll receive a notification once it\'s approved and live on DataNext.', showSuccess: true },
    ],
  },
};

@Component({
  selector: 'app-contribute',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetCardComponent, PromptBarComponent, PrimaryBtnDirective, ChipSelectComponent, GeoSelectComponent, AIReasoningLoaderComponent],
  templateUrl: './contribute.component.html',
  styleUrl: './contribute.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContributeComponent implements OnInit, AfterViewChecked, OnDestroy {
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly chatService = inject(ChatService);
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  title        = signal('Contribute an Asset');
  editingTitle = signal(false);

  messages = signal<ChatMsg[]>([{
    role: 'assistant',
    text: "Hi! I'll help you contribute a new asset to DataNext. What would you like to onboard? Describe what it is, what it contains, and how it's used.",
  }]);

  step = signal<ConvStep>('await-asset');
  thinking = signal(false);

  submissionStatus = signal<'review' | 'published'>('review');
  submittedAt      = signal('Today');

  private historyPushed = false;
  private submittedSummary = '';

  readonly similarAssets = [
    {
      tag: 'Dataset' as const,
      tagColor: 'blue' as const,
      title: 'Climate Resilience Risk Index — Pacific SIDS',
      description: 'Composite index tracking climate vulnerability across Pacific small island developing states.',
      rating: '4.7',
      users: '892',
      downloads: '201',
      restricted: true,
    },
    {
      tag: 'Dataset' as const,
      tagColor: 'blue' as const,
      title: 'SDG Global Indicators Monitor',
      description: 'Aggregated SDG tracking metrics sourced from UN, WHO, World Bank, and ADB datasets.',
      rating: '4.5',
      users: '1.4k',
      downloads: '680',
    },
  ];

  form: ContributeForm = {
    title: '',
    type: 'Dataset',
    description: '',
    departments: [],
    contact: '',
    access: 'Public',
    format: '',
    dataSize: '',
    rowCount: '',
    sectorGroup: '',
    geoCoverage: [],
    timePeriod: '',
    updateFreq: 'Annual',
    themes: [],
  };

  formErrors     = signal<Partial<Record<keyof ContributeForm, string>>>({});
  formDone       = signal(false);
  panelCollapsed = signal(false);
  fileAttached   = signal(false);
  attachedFileName = signal('');
  uploadSkipped      = signal(false);
  largeDatasetMode   = signal(false);
  fileProcessing     = signal(false);
  readonly themeOptions = THEME_OPTIONS;
  readonly deptOptions  = DEPT_OPTIONS;
  readonly deptLabels   = DEPT_LABELS;
  private needsScroll: 'bottom' | 'last-assistant' | null = null;

  onFileAttached(): void {
    this.fileAttached.set(true);
    this.attachedFileName.set('asean_water_quality_2025.parquet');
    this.fileProcessing.set(true);
    setTimeout(() => {
      this.form.title       = 'ASEAN Urban Water Quality Index';
      this.form.type        = 'Dataset';
      this.form.description = 'Composite monitoring dataset tracking urban water quality across ASEAN member states — turbidity, pH, dissolved oxygen, and contamination indicators from municipal systems in 47 cities.';
      this.form.departments = ['SDCC'];
      this.form.contact     = 'data.products@adb.org';
      this.form.access      = 'Public';
      this.form.format      = 'Parquet / CSV';
      this.form.dataSize    = '2.3 GB';
      this.form.rowCount    = '4.1M';
      this.form.sectorGroup = 'Climate & Environment';
      this.form.geoCoverage = ['Southeast Asia'];
      this.form.timePeriod  = '2010–2025';
      this.form.updateFreq  = 'Quarterly';
      this.form.themes      = ['Water & Sanitation', 'Urban', 'Environment', 'SDG', 'Climate'];
      this.fileProcessing.set(false);
    }, 1800);
  }

  clearFile(): void {
    this.fileAttached.set(false);
    this.attachedFileName.set('');
    this.uploadSkipped.set(false);
    this.fileProcessing.set(false);
    this.form = {
      title: '', type: 'Dataset', description: '', departments: [], contact: '',
      access: 'Public', format: '', dataSize: '', rowCount: '',
      sectorGroup: '', geoCoverage: [], timePeriod: '', updateFreq: 'Annual', themes: [],
    };
  }

  skipUpload(): void {
    this.uploadSkipped.set(true);
  }

  async startLargeDataset(): Promise<void> {
    this.largeDatasetMode.set(true);
    this.messages.update(m => [...m, { role: 'user', text: 'I have a large dataset (over 100 GB). I\'d like to set up a transfer.' }]);
    this.scrollToBottom();
    this.thinking.set(true);
    await new Promise(r => setTimeout(r, 1100));
    this.thinking.set(false);
    this.step.set('large-dataset');
    this.messages.update(m => [...m, {
      role: 'assistant',
      text: `Large dataset — no upload needed.\n\nTell me a little about the dataset and I'll help capture the required details. For datasets over 100 GB, the DataNext+ team will coordinate the transfer with you directly.`,
      showLargeDatasetForm: true,
    }]);
    this.scrollToLastAssistant();
  }

  async submitLargeDataset(): Promise<void> {
    const errors: Partial<Record<keyof ContributeForm, string>> = {};
    if (!this.form.title.trim())       errors['title']       = 'Required';
    if (!this.form.description.trim()) errors['description'] = 'Required';
    this.formErrors.set(errors);
    if (Object.keys(errors).length) return;

    this.thinking.set(true);
    await new Promise(r => setTimeout(r, 1400));
    this.thinking.set(false);
    const assetTitle = this.form.title;
    this.formDone.set(true);
    this.step.set('done');
    if (this.title() === 'Contribute an Asset') this.title.set(assetTitle);
    this.submittedSummary = `Large dataset handoff: ${assetTitle}`;
    this.historyPushed = false;

    this.messages.update(m => [...m, {
      role: 'assistant',
      text: `Got it. We'll route "${assetTitle}" to the DataNext+ team — they'll reach out to ${this.form.contact || 'you'} to arrange the transfer. No further action needed on your end.`,
      showSuccess: true,
    }]);
    this.scrollToLastAssistant();
  }

  cardTagColor(type: string): 'blue' | 'violet' | 'amber' | 'teal' {
    const map: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'AI Platform': 'blue',
      'AI Agent': 'violet', 'AI Tool': 'violet',
      'Dashboard': 'amber', 'API': 'teal',
    };
    return map[type] ?? 'blue';
  }

  startEditTitle(): void { this.editingTitle.set(true); }

  saveTitle(value: string): void {
    const trimmed = value.trim();
    if (trimmed) this.title.set(trimmed);
    this.editingTitle.set(false);
  }

  private pushToHistory(): void {
    if (this.historyPushed) return;
    const msgs = this.messages();
    const firstUser = msgs.find(m => m.role === 'user');
    if (!firstUser) return;
    this.historyPushed = true;
    const summary = this.submittedSummary ||
      (firstUser.text
        ? firstUser.text.length > 90 ? firstUser.text.slice(0, 88) + '…' : firstUser.text
        : 'Contribution in progress');
    this.chatService.addContributeItem(this.title(), summary);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('submission');
    if (!id) return;
    const mock = MOCK_SUBMISSIONS[id];
    if (!mock) return;
    this.title.set(mock.form.title);
    Object.assign(this.form, mock.form);
    this.messages.set(mock.conversation);
    this.step.set('done');
    this.formDone.set(true);
    this.submissionStatus.set(mock.status);
    this.submittedAt.set(mock.submittedAt);
    this.historyPushed = true;
  }

  ngOnDestroy(): void { this.pushToHistory(); }

  ngAfterViewChecked(): void {
    if (!this.needsScroll || !this.messagesEl) return;
    const el = this.messagesEl.nativeElement;
    if (this.needsScroll === 'last-assistant') {
      const bubbles = el.querySelectorAll<HTMLElement>('.contrib__msg--assistant');
      const last = bubbles[bubbles.length - 1];
      if (last) {
        el.scrollTop = last.offsetTop - 16;
        this.needsScroll = null;
        return;
      }
    }
    el.scrollTop = el.scrollHeight;
    this.needsScroll = null;
  }

  private scrollToBottom(): void { this.needsScroll = 'bottom'; }
  private scrollToLastAssistant(): void { this.needsScroll = 'last-assistant'; }

  async onPrompt(text: string): Promise<void> {
    if (this.thinking()) return;
    this.messages.update(m => [...m, { role: 'user', text }]);
    this.scrollToBottom();

    this.thinking.set(true);
    await new Promise(r => setTimeout(r, 1300));
    this.thinking.set(false);

    if (this.step() === 'await-asset') {
      this.step.set('await-proceed');
      this.messages.update(m => [...m, {
        role: 'assistant',
        text: `Thanks for sharing! We already have a few assets that cover similar ground. Take a look — you may find what you need is already available:`,
        showSimilar: true,
      }]);

    } else if (this.step() === 'await-proceed') {
      const yes = /\b(yes|yep|sure|proceed|continue|still|ok|go ahead|do it)\b/i.test(text);
      if (yes) {
        this.openForm();
      } else {
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: `No problem! You can explore the existing assets in the catalogue, or come back anytime to contribute something new.`,
        }]);
      }

    } else if (this.step() === 'await-form') {
      this.messages.update(m => [...m, {
        role: 'assistant',
        text: `The form is above — fill it in and hit Submit when you're ready. Let me know if you have questions about any field.`,
      }]);

    } else if (this.step() === 'done') {
      // Start a fresh contribution round
      this.form = {
        title: '', type: 'Dataset', description: '', departments: [], contact: '',
        access: 'Public', format: '', dataSize: '', rowCount: '',
        sectorGroup: '', geoCoverage: [], timePeriod: '', updateFreq: 'Annual', themes: [],
      };
      this.formErrors.set({});
      this.formDone.set(false);
      this.step.set('await-proceed');
      this.messages.update(m => [...m, {
        role: 'assistant',
        text: `Thanks! Here are some existing assets in that area — let me know if you'd still like to proceed:`,
        showSimilar: true,
      }]);
    }

    this.scrollToLastAssistant();
  }

  openForm(): void {
    this.step.set('await-form');
    this.messages.update(m => [...m, {
      role: 'assistant',
      text: `Great! Please fill in the details below. Fields marked * are required — Format, Size, and Rows will auto-populate when you attach the asset file.`,
      showForm: true,
    }]);
    this.scrollToLastAssistant();
  }

  async submitForm(): Promise<void> {
    const errors: Partial<Record<keyof ContributeForm, string>> = {};
    if (!this.form.title.trim())       errors['title']       = 'Required';
    if (!this.form.description.trim()) errors['description'] = 'Required';
    this.formErrors.set(errors);
    if (Object.keys(errors).length) return;

    this.thinking.set(true);
    await new Promise(r => setTimeout(r, 1500));
    this.thinking.set(false);
    const assetTitle = this.form.title;
    this.formDone.set(true);
    this.step.set('done');
    // Auto-title the conversation after first submission if still on the default
    if (this.title() === 'Contribute an Asset') this.title.set(assetTitle);
    this.submittedSummary = `Submitted: ${assetTitle}`;
    this.historyPushed = false; // allow re-push with updated summary

    const successText = this.uploadSkipped()
      ? `Thanks — we've got your metadata for "${assetTitle}". Because no file was attached, a data engineer will reach out to ${this.form.contact || 'you'} directly to set up the migration path. Got another asset to contribute? Just describe it below.`
      : `Your asset "${assetTitle}" has been submitted for review. The data governance team will reach out to ${this.form.contact || 'you'} within 2–3 business days. You'll receive a notification once it's approved and live on DataNext. Got another asset to contribute? Just describe it below.`;

    this.messages.update(m => [...m, {
      role: 'assistant',
      text: successText,
      showSuccess: true,
    }]);
    this.scrollToLastAssistant();
  }

  close(): void {
    this.pushToHistory();
    this.router.navigate(['/notebooks'], { queryParams: { tab: 'chats' } });
  }
}
