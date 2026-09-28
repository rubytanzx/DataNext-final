import {
  Component, input, signal, computed, effect,
  OnInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core';
import { DotMatrixLoaderComponent } from '../dot-matrix-loader/dot-matrix-loader.component';
import { AgenticTaskLoaderComponent, AgenticTask } from '../agentic-task-loader/agentic-task-loader.component';

const DEFAULT_PHASES = ['Thinking', 'Searching', 'Preparing Results'];

@Component({
  selector: 'ia-ai-reasoning-loader',
  standalone: true,
  imports: [DotMatrixLoaderComponent, AgenticTaskLoaderComponent],
  template: `
    <div class="ia-reasoning">
      <button
        class="ia-reasoning__header"
        type="button"
        (click)="toggleCollapse()"
        [attr.aria-expanded]="!isCollapsed()"
        [attr.aria-label]="currentPhase() + '... ' + elapsed() + ' seconds'"
      >
        <ia-dot-matrix-loader [size]="20" />
        <span class="ia-reasoning__label">{{ currentPhase() }}...</span>
        <span class="ia-reasoning__timer">{{ elapsed() }}s</span>
        <svg
          class="ia-reasoning__chevron"
          [class.ia-reasoning__chevron--up]="!isCollapsed()"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      @if (!isCollapsed()) {
        <div class="ia-reasoning__body">
          @if (currentThought()) {
            <p class="ia-reasoning__thought">{{ currentThought() }}</p>
          }
          @if (tasks().length > 0) {
            <ia-agentic-task-loader class="ia-reasoning__tasks" [tasks]="tasks()" />
          }
        </div>
      }
    </div>
  `,
  styleUrl: './ai-reasoning-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AIReasoningLoaderComponent implements OnInit, OnDestroy {
  phases        = input<string[]>(DEFAULT_PHASES);
  phaseDuration = input<number>(4000);
  tasks         = input<AgenticTask[]>([]);
  thoughts      = input<string[]>([]);

  elapsed     = signal(0);
  isCollapsed = signal(false);

  private phaseIndex = signal(0);

  private resolvedPhases = computed(() => {
    const p = this.phases();
    return p.length > 0 ? p : DEFAULT_PHASES;
  });

  currentPhase = computed(() => {
    const list = this.resolvedPhases();
    return list[this.phaseIndex() % list.length];
  });

  currentThought = computed(() => {
    const t = this.thoughts();
    if (!t.length) return '';
    return t[this.phaseIndex() % t.length];
  });

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect((onCleanup) => {
      const duration = this.phaseDuration();
      const id = setInterval(() => this.phaseIndex.update(i => i + 1), duration);
      onCleanup(() => clearInterval(id));
    });
  }

  ngOnInit(): void {
    this.timerInterval = setInterval(() => this.elapsed.update(v => v + 1), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval !== null) clearInterval(this.timerInterval);
  }

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
}
