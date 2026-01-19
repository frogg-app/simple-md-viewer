# Large File Performance Test

This file is designed to test the performance of the markdown renderer with a large amount of content.

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)
- [Section 4](#section-4)
- [Section 5](#section-5)
- [Section 6](#section-6)
- [Section 7](#section-7)
- [Section 8](#section-8)
- [Section 9](#section-9)
- [Section 10](#section-10)

---

## Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl. Nullam auctor, nisl nec ultricies ultricies, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl.

### Code Example 1

```javascript
class Section1 {
  constructor() {
    this.data = [];
    this.initialized = false;
  }

  async init() {
    this.data = await this.fetchData();
    this.initialized = true;
    return this;
  }

  async fetchData() {
    return new Promise(resolve => {
      setTimeout(() => resolve([1, 2, 3, 4, 5]), 100);
    });
  }

  process() {
    return this.data.map(x => x * 2);
  }
}
```

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Data 1 | Data 2 | Data 3 | Data 4 |
| Data 5 | Data 6 | Data 7 | Data 8 |
| Data 9 | Data 10 | Data 11 | Data 12 |

---

## Section 2

Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Nested Lists

1. First level
   - Second level a
   - Second level b
     1. Third level 1
     2. Third level 2
        - Fourth level
   - Second level c
2. First level again
   - More nesting
     - Even more
       - Maximum depth

### Task List

- [x] Task 1 completed
- [x] Task 2 completed
- [ ] Task 3 pending
- [ ] Task 4 pending
- [x] Task 5 completed
- [ ] Task 6 pending
- [x] Task 7 completed
- [ ] Task 8 pending

---

## Section 3

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Code Example 2

```python
import asyncio
from typing import List, Optional

class DataProcessor:
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.results: List[dict] = []

    async def process_batch(self, data: List[dict]) -> List[dict]:
        tasks = [self.process_item(item) for item in data]
        return await asyncio.gather(*tasks)

    async def process_item(self, item: dict) -> dict:
        await asyncio.sleep(0.01)
        return {**item, 'processed': True}

    def get_statistics(self) -> dict:
        total = len(self.results)
        processed = sum(1 for r in self.results if r.get('processed'))
        return {'total': total, 'processed': processed}
```

> This is a blockquote that spans multiple paragraphs.
>
> It contains **bold** and *italic* text, as well as `code`.
>
> > And even nested blockquotes.

---

## Section 4

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.

### Math Examples

Inline math: $a^2 + b^2 = c^2$ and $e^{i\pi} + 1 = 0$

Block equations:

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}
$$

$$
\mathbf{F} = m\mathbf{a} = m\frac{d\mathbf{v}}{dt}
$$

---

## Section 5

Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit.

### Large Table

| ID | Name | Email | Status | Created | Updated | Notes |
|----|------|-------|--------|---------|---------|-------|
| 1 | Alice | alice@example.com | Active | 2024-01-01 | 2024-01-15 | Primary user |
| 2 | Bob | bob@example.com | Active | 2024-01-02 | 2024-01-14 | Secondary user |
| 3 | Charlie | charlie@example.com | Inactive | 2024-01-03 | 2024-01-13 | Suspended |
| 4 | Diana | diana@example.com | Active | 2024-01-04 | 2024-01-12 | Admin |
| 5 | Eve | eve@example.com | Pending | 2024-01-05 | 2024-01-11 | Awaiting approval |
| 6 | Frank | frank@example.com | Active | 2024-01-06 | 2024-01-10 | Developer |
| 7 | Grace | grace@example.com | Active | 2024-01-07 | 2024-01-09 | Designer |
| 8 | Henry | henry@example.com | Inactive | 2024-01-08 | 2024-01-08 | Former employee |
| 9 | Ivy | ivy@example.com | Active | 2024-01-09 | 2024-01-07 | Marketing |
| 10 | Jack | jack@example.com | Active | 2024-01-10 | 2024-01-06 | Sales |

---

## Section 6

Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.

### Code Block 3

```typescript
interface Config {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  autoSave: boolean;
  recentFiles: string[];
}

class ConfigManager {
  private config: Config;
  private readonly storageKey = 'app-config';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getDefaultConfig();
      }
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): Config {
    return {
      theme: 'system',
      fontSize: 16,
      autoSave: true,
      recentFiles: []
    };
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  private saveConfig(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }
}
```

---

## Section 7

Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.

### Definition List

Markdown
: A lightweight markup language for creating formatted text using a plain-text editor.

Mermaid
: A JavaScript-based diagramming and charting tool that renders Markdown-inspired text definitions.

KaTeX
: A fast, easy-to-use JavaScript library for TeX math rendering on the web.

Electron
: A framework for building cross-platform desktop applications using web technologies.

---

## Section 8

Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus.

### More Paragraphs

Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna.

Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus.

Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia.

---

## Section 9

Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum.

### Inline Formatting

- **Bold text** for emphasis
- *Italic text* for titles
- ~~Strikethrough~~ for deleted content
- `inline code` for code snippets
- [Links](https://example.com) for navigation
- Subscript: H~2~O (may not render)
- Superscript: E=mc^2^ (may not render)

### Escaped Characters

\*Not italic\*
\**Not bold\**
\`Not code\`
\# Not a heading

---

## Section 10

Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris.

### Final Code Block

```go
package main

import (
    "fmt"
    "sync"
)

type Counter struct {
    mu    sync.Mutex
    count int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

func main() {
    counter := &Counter{}
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }

    wg.Wait()
    fmt.Printf("Final count: %d\n", counter.Value())
}
```

---

## Conclusion

This large file tests:
- Heading rendering at multiple levels
- Code blocks in multiple languages
- Tables of various sizes
- Lists (ordered, unordered, task)
- Blockquotes
- Math equations
- Inline formatting
- Definition lists
- Scroll performance
- Link navigation

The end.
