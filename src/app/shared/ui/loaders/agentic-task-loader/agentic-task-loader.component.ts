import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type AgenticTaskStatus = 'completed' | 'in-progress' | 'pending';

export interface AgenticTask {
  title: string;
  description?: string;
  status: AgenticTaskStatus;
}

@Component({
  selector: 'ia-agentic-task-loader',
  standalone: true,
  template: `
    <div class="ia-agentic">
      <div class="ia-agentic__header">
        <div class="ia-agentic__header-left">
          @if (hasActiveTask()) {
            <svg class="ia-agentic__header-spinner" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <line x1="10" y1="2"  x2="10" y2="6"   stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="10" y1="14" x2="10" y2="18"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="2"  y1="10" x2="6"  y2="10"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="14" y1="10" x2="18" y2="10"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="4.34"  y1="4.34"   x2="7.17"  y2="7.17"   stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="12.83" y1="12.83"  x2="15.66" y2="15.66"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="15.66" y1="4.34"   x2="12.83" y2="7.17"   stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="7.17"  y1="12.83"  x2="4.34"  y2="15.66"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          }
          <span class="ia-agentic__title">Tasks: {{ totalCount() }} total</span>
        </div>
        @if (hasActiveTask()) {
          <div class="ia-agentic__header-right">
            @if (inProgressCount() > 0) {
              <span class="ia-agentic__badge ia-agentic__badge--progress">
                <svg class="ia-agentic__badge-spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="#E5E7EB" stroke-width="1.5"/>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28 10" stroke-linecap="round"/>
                </svg>
                {{ inProgressCount() }} in progress
              </span>
            }
            @if (pendingCount() > 0) {
              <span class="ia-agentic__badge ia-agentic__badge--pending">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="ia-agentic__badge-icon">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 5v3l2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ pendingCount() }} pending
              </span>
            }
          </div>
        }
      </div>
      <div class="ia-agentic__tasks">
        @for (task of tasks(); track $index) {
          <div class="ia-agentic__task">
            <div class="ia-agentic__task-icon">
              @switch (task.status) {
                @case ('completed') {
                  <svg viewBox="0 0 22 22" fill="none" role="img" aria-label="Completed">
                    <circle cx="11" cy="11" r="11" fill="#43A047"/>
                    <path d="M6.5 11l3 3 6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
                @case ('in-progress') {
                  <svg class="ia-agentic__task-spinner" viewBox="0 0 22 22" fill="none" role="img" aria-label="In progress">
                    <circle cx="11" cy="11" r="9" stroke="#E5E7EB" stroke-width="2"/>
                    <circle cx="11" cy="11" r="9" stroke="#3B82F6" stroke-width="2" stroke-dasharray="42 15" stroke-linecap="round"/>
                  </svg>
                }
                @case ('pending') {
                  <svg viewBox="0 0 22 22" fill="none" role="img" aria-label="Pending">
                    <circle cx="11" cy="11" r="9" stroke="#F59E0B" stroke-width="2"/>
                    <path d="M11 7v4l2.5 2" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              }
            </div>
            <div class="ia-agentic__task-body">
              <span class="ia-agentic__task-title">{{ task.title }}</span>
              @if (task.description) {
                <span class="ia-agentic__task-desc">{{ task.description }}</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './agentic-task-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgenticTaskLoaderComponent {
  tasks = input<AgenticTask[]>([]);

  totalCount      = computed(() => this.tasks().length);
  inProgressCount = computed(() => this.tasks().filter(t => t.status === 'in-progress').length);
  pendingCount    = computed(() => this.tasks().filter(t => t.status === 'pending').length);
  hasActiveTask   = computed(() => this.inProgressCount() > 0 || this.pendingCount() > 0);
}
