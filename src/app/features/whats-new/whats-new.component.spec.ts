import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

describe('WhatsNewComponent', () => {
  let WhatsNewComponent: typeof import('./whats-new.component').WhatsNewComponent;

  beforeAll(async () => {
    // jsdom does not implement `window.matchMedia`. GSAP's ScrollTrigger plugin calls
    // it synchronously via `gsap.registerPlugin(ScrollTrigger)`, a top-level statement
    // in whats-new.component.ts that runs as soon as the module is evaluated — before
    // any test body runs, and regardless of whether detectChanges()/ngAfterViewInit is
    // ever called. Stub it here, then import the component dynamically so the stub is
    // in place before that module-evaluation side effect fires. This only unblocks
    // loading the module in this environment; it has no bearing on the assertions below.
    if (typeof window.matchMedia !== 'function') {
      (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;
    }

    ({ WhatsNewComponent } = await import('./whats-new.component'));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsNewComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to the discover tab and switches when setTab is called', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    const component = fixture.componentInstance;

    expect(component.activeTab()).toBe('discover');

    component.setTab('trust');

    expect(component.activeTab()).toBe('trust');
  });

  it('tags every roadmap item except the trailing "more" entry', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    const component = fixture.componentInstance;

    const withTitle = component.roadmap.filter(item => item.title);
    const trailing = component.roadmap[component.roadmap.length - 1];

    expect(withTitle.length).toBeGreaterThan(0);
    expect(withTitle.every(item => !!item.tag)).toBe(true);
    expect(trailing.title).toBe('');
    expect(trailing.tag).toBeUndefined();
  });
});
