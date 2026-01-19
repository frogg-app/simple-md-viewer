# Mermaid Diagram Tests

This file tests all supported Mermaid diagram types.

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Server
    participant Database

    User->>App: Open file
    App->>Server: Request file
    Server->>Database: Query
    Database-->>Server: Data
    Server-->>App: File content
    App-->>User: Display markdown
```

## Class Diagram

```mermaid
classDiagram
    class MarkdownRenderer {
        +String currentFilePath
        +render(markdown) String
        +setupMarked() void
    }
    class MermaidHandler {
        +Map zoomControllers
        +init(theme) void
        +renderDiagrams(container) void
    }
    class ZoomController {
        +Number scale
        +zoomIn() void
        +zoomOut() void
        +resetZoom() void
    }
    MarkdownRenderer --> MermaidHandler
    MermaidHandler --> ZoomController
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : Open File
    Loading --> Rendering : Parse Complete
    Rendering --> Ready : Render Complete
    Ready --> Loading : Reload
    Ready --> Idle : Close
    Loading --> Error : Parse Failed
    Error --> Idle : Dismiss
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ FILE : opens
    USER {
        string id
        string name
        string email
    }
    FILE ||--|{ REVISION : has
    FILE {
        string path
        string content
        datetime modified
    }
    REVISION {
        string hash
        datetime created
    }
```

## Gantt Chart

```mermaid
gantt
    title MD Viewer Development
    dateFormat  YYYY-MM-DD
    section Core
    Setup Project       :done, a1, 2024-01-01, 3d
    Markdown Rendering  :done, a2, after a1, 5d
    Theme Support       :done, a3, after a2, 2d
    section Features
    Mermaid Support     :active, b1, after a3, 5d
    Zoom Controls       :b2, after b1, 3d
    Remote Files        :b3, after b2, 7d
    section Polish
    Testing             :c1, after b3, 5d
    Documentation       :c2, after c1, 3d
```

## Pie Chart

```mermaid
pie title Code Distribution
    "JavaScript" : 45
    "CSS" : 25
    "HTML" : 15
    "Configuration" : 10
    "Documentation" : 5
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Add renderer"
    commit id: "Add mermaid"
    checkout main
    merge develop id: "v1.0.0"
    branch feature
    checkout feature
    commit id: "Remote files"
    checkout develop
    commit id: "Bug fixes"
    checkout main
    merge develop id: "v1.1.0"
```

## Mindmap

```mermaid
mindmap
  root((MD Viewer))
    Features
      Markdown Rendering
        GFM Support
        Syntax Highlighting
      Mermaid Diagrams
        Zoom Controls
        Fullscreen
      Theme Support
        Light
        Dark
        System
    Platforms
      Desktop
        Windows
        macOS
        Linux
      Web
        Docker
        Standalone
    File Sources
      Local
      Remote
        SSH
        SMB
        NFS
```

## Syntax Error Test

This diagram has a syntax error and should display an error message:

```mermaid
flowchart TD
    This is not valid mermaid syntax
    A --> B --> --> C
```

## Complex Flowchart

```mermaid
flowchart LR
    subgraph Frontend
        A[User Interface] --> B[Theme Manager]
        A --> C[Markdown Renderer]
        C --> D[Mermaid Handler]
        D --> E[Zoom Controller]
    end

    subgraph Backend
        F[File Watcher] --> G[IPC Handler]
        H[Remote Manager] --> G
        I[Credential Manager] --> H
    end

    A <--> G
    G <--> F
    G <--> H
```
