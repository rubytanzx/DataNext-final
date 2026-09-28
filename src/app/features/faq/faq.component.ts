import { Component, signal, ChangeDetectionStrategy, OnInit, OnDestroy, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  id: string;
  label: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent implements OnInit, OnDestroy {
  openItem = signal<string | null>(null);
  activeSection = signal<string>('getting-started');

  paragraphs(text: string): string[] {
    return text.split('\n\n').filter(p => p.trim());
  }

  private observer?: IntersectionObserver;
  private el = inject(ElementRef);

  ngOnInit(): void {
    const scrollRoot = this.el.nativeElement as HTMLElement;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          this.activeSection.set(visible[0].target.id);
        }
      },
      { root: scrollRoot, rootMargin: '0px 0px -60% 0px', threshold: 0 },
    );
    setTimeout(() => {
      this.sections.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) this.observer!.observe(el);
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  readonly sections: FaqSection[] = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      items: [
        {
          q: 'What is DataNex+?',
          a: 'DataNex+, the expansion of DataNex, is a foundational intelligence platform built for ADB\'s work. It helps you unlock the full value of the bank\'s assets by bringing together trusted and governed datasets, AI capabilities, and other reusable building blocks into a single platform. Whether you\'re exploring a new idea, addressing a business need, or looking for ways to strengthen a project, DataNex+ provides a starting point for discovering what capabilities already exist across ADB before building something new.\n\nSimply describe what you are looking for, and the system connects you to available resources that you can reuse instead of starting from scratch. By making ADB\'s capabilities easier to find, access, and reuse, DataNex+ helps turn available information and technology investments into smarter decisions, stronger operations, and greater development impact. DataNex+ will grow with ADB: it will continue to expand its capabilities, deepen its understanding of ADB\'s context, and integrate more seamlessly into the way ADB works.',
        },
        {
          q: 'How can DataNex+ help me in my work?',
          a: 'DataNex+ can help you unlock institutional knowledge, achieve impact faster, and make better-informed decisions by supporting you across three pillars:\n\n• Discover. DataNex+ brings together trusted data, knowledge, and digital assets into a single, intuitive platform.\n• Connect. DataNex+ helps you identify relevant resources and connect with the people behind them, enabling greater collaboration across teams and departments. It also allows you to contribute assets for colleagues\' use.\n• Reuse. DataNex+ makes it easier for you to find and build on available datasets, tools, and solutions instead of reinventing them so you can work more efficiently and maximize the value of ADB\'s collective investments.',
        },
        {
          q: 'How does DataNex+ differ from other data platforms within ADB?',
          a: 'DataNex+ complements ADB\'s existing platforms by providing a contextual discovery experience. It also serves as a centralized source of relevant datasets from outside ADB — such as public, partner, and commercial sources — to make them easier for personnel to access. Beyond datasets, DataNex+ brings together other assets from various domains into one platform, making it easier to identify what already exists within ADB that may be leveraged to address a specific business need.',
        },
      ],
    },
    {
      id: 'accessing-datanex',
      label: 'Accessing DataNex+',
      items: [
        {
          q: 'Do I have access to DataNex+?',
          a: 'DataNex+ is meant to be available to all personnel with an ADB email address. Beginning in October, early release users will be able to sign in using ADB\'s Single Sign-On (SSO). Access will be expanded over time as the platform continues to evolve.',
        },
        {
          q: 'How can I access DataNex+?',
          a: 'You can access the platform at datanex.adb.org.',
        },
      ],
    },
    {
      id: 'understanding-assets',
      label: 'Understanding Assets',
      items: [
        {
          q: 'What are assets?',
          a: 'In DataNex+, an asset is any discoverable and reusable resource available through the platform. Assets can include datasets, models, dashboards, workflows, templates, AI agents, pipelines, and other resources that users can access and build upon.\n\nEach asset is accompanied by metadata that provides important information such as ownership, life cycle and trust status, classification, and access requirements. These attributes help users understand an asset\'s purpose, reliability, and availability, and determine how the asset can be accessed and reused.\n\nAvailability and reuse permissions vary depending on an asset\'s classification, ownership, and access conditions.',
        },
        {
          q: 'What assets can I find on DataNex+?',
          a: 'These assets are available on DataNex+ in October 2026:\n\n• Datasets\n• AI Tools\n• AI Agents\n• AI Products',
        },
        {
          q: 'How do AI tools, AI agents, and AI products differ from each other?',
          a: 'In DataNex+, AI assets are grouped into three categories:\n\n• AI Tool: A governed AI capability that performs a common task and can be used across many scenarios. Examples include translation, image generation, and summarization.\n• AI Agent: A governed AI capability designed for a specific use case. It leverages Model Context Protocol (MCP) capabilities to access relevant context, information, and resources needed to perform a defined task.\n• AI Product: A complete, end-to-end solution that brings together AI capabilities, data, workflows, and user interfaces to deliver a specific user experience or business outcome.',
        },
        {
          q: 'Which AI asset category should I use?',
          a: 'The right AI asset category depends on your needs. If you need support for a common task, an AI tool may be sufficient. If you need AI tailored to a specific use case, an AI agent may be more appropriate. If you\'re looking for a complete user-facing solution, an AI product is likely the best fit.',
        },
        {
          q: 'Will more asset types be added in the future?',
          a: 'DataNex+ is designed to grow alongside ADB\'s data and AI ecosystem. New asset types, integrations, and features may be added over time to improve discovery, reuse, and collaboration.',
        },
        {
          q: 'Are all of ADB\'s assets available in DataNex+?',
          a: 'Not all of ADB\'s assets are available in DataNex+. That said, the catalog will grow over time to accommodate new assets and asset types. Reach out to us at datanex@adb.org if you\'re interested in submitting assets.',
        },
        {
          q: 'How will I know if new data assets and asset types are added?',
          a: 'Our dedicated "What\'s New" section tracks what new assets and asset types are added.',
        },
      ],
    },
    {
      id: 'finding-accessing',
      label: 'Finding and Accessing Assets',
      items: [
        {
          q: 'How does DataNex+ match me to assets relevant to my business need?',
          a: 'DataNex+\'s ADB Contextual Search Agent enables you to search in natural language. The system will interpret your intent to recommend relevant assets and AI capabilities from across DataNex+. This helps you discover resources relevant to your business need, even when you are not sure exactly what you are looking for.',
        },
        {
          q: 'Can I explore DataNex+ assets that were developed outside of my department?',
          a: 'Yes. DataNex+ is designed to help users discover cataloged assets across organizational and domain boundaries, making it easier to find and reuse resources developed by other departments and teams. However, while discoverability is broad, access and reuse depend on the asset\'s governance, security, confidentiality, licensing, and other applicable restrictions. Each asset\'s metadata includes these details, as well as information on the asset\'s trust status and life cycle stage.',
        },
        {
          q: 'Can I automatically access all assets on DataNex+?',
          a: 'No. Access will depend on the access permissions per asset (i.e., public, internal ADB, restricted). Some assets may be accessible immediately, while others may require approval from the product owners. DataNex+ respects those controls and helps users request access when needed, but approval will depend on asset owners.',
        },
        {
          q: 'What if I can\'t find what I\'m looking for?',
          a: 'You can try refining your prompts or keywords if your initial search does not yield results. If you still cannot find what you need after refining your search, please send us a message via the Need Help page. Your feedback, including suggestions on assets to expand the catalog, will help inform future enhancements.',
        },
      ],
    },
    {
      id: 'collaboration',
      label: 'Collaboration',
      items: [
        {
          q: 'Can I share DataNex+ assets with colleagues?',
          a: 'Yes, DataNex+ has a share button to make it easy for users to share assets with colleagues, provided that they also have DataNex+ access.',
        },
      ],
    },
    {
      id: 'contributing',
      label: 'Contributing Assets',
      items: [
        {
          q: 'I want to contribute an asset. How do I go about it?',
          a: 'You can reach out to us at datanex@adb.org or click on the "Contribute an Asset" button in DataNex+ if you want to contribute an asset. In the future, we will integrate a feature that will enable users to submit an asset on the platform itself.\n\nBefore you submit an asset:\n• confirm you have sharing rights\n• identify access restrictions',
        },
        {
          q: 'What criteria are used to evaluate whether assets can be added to DataNex+?',
          a: 'An asset may be considered for inclusion in DataNex+ when it:\n\n• is relevant to ADB\'s work and has potential for reuse;\n• has an identified business owner and contact;\n• has the required descriptive and technical metadata;\n• has its ADB information classification and access conditions confirmed by the owning business unit;\n• has its source, licensing, and permitted-use conditions documented;\n• meets applicable quality, security, privacy, governance and Responsible AI requirements; and\n• has a defined arrangement for maintenance, updates or life cycle management.\n\nInclusion in the catalog makes an asset discoverable. It does not automatically mean that the asset is approved for all use cases, available to every user, or independently verified by DataNex+.',
        },
        {
          q: 'Will assets that I submit automatically show up in DataNex+?',
          a: 'No. Submitted assets will need to be reviewed and approved by teams responsible for the assets.',
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          q: 'I found an error or issue while using DataNex+. How do I give feedback?',
          a: 'We welcome feedback to help us improve DataNex+. If you see an error in the chat feature, we invite you to use the thumbs up/thumbs down feature and provide the details when prompted. If the error or issue is found elsewhere in DataNex+, please share the details by filling up the feedback form available in the "Need Help?" tab.',
        },
        {
          q: 'My question is not listed here.',
          a: 'You can reach out to us by contacting us at datanex@adb.org or filling up the feedback form available in the "Need Help?" tab.',
        },
      ],
    },
  ];

  toggle(id: string): void {
    this.openItem.set(this.openItem() === id ? null : id);
  }

  scrollTo(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
