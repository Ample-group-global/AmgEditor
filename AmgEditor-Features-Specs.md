# AmgEditor - Features & Specifications

> **Package**: `@amplecapitalglobal/editor` | **Version**: 1.0.8 | **License**: MIT
> A Notion-like block editor component for React

**Demo**: https://amg-editor.vercel.app/

---

## Table of Contents

- [Part 1: Editor Features](#part-1-editor-features)
- [Part 2: Markdown Import Features](#part-2-markdown-import-features)
- [Part 3: Public API & Integration](#part-3-public-api--integration)
- [Part 4: .NET Core API Integration](#part-4-net-core-api-integration)
- [Part 5: Tech Stack & Build](#part-5-tech-stack--build)

---

## Part 1: Editor Features

### Block Types

| Block Type | Slash Menu | Auto-detect Shortcut |
|------------|-----------|---------------------|
| **Text** | Yes | (default) |
| **Heading 1 / 2 / 3** | Yes | `# ` / `## ` / `### ` |
| **Bullet List** | Yes | `- ` or `* ` or `+ ` |
| **Numbered List** | Yes | `1. ` |
| **To-do List** | Yes | `- [ ] ` or `- [x] ` |
| **Quote** | Yes | `> ` |
| **Divider** | Yes | `---` or `***` or `___` |
| **Callout** | Yes | `:::info`, `:::warning`, `:::danger` |
| **Code Block** | Yes | ` ``` ` or `~~~ ` |
| **Math Block** | Yes | `$$` |
| **Diagram** | Yes | `/diagram` or ` ```mermaid ` |
| **Image** | Yes | `![alt](url)` |
| **Video** | Yes | `/video` |
| **File** | Yes | `/file` |
| **Table** | Yes | `/table` or `| col |` |
| **Table of Contents** | Yes | — |

### Inline Formatting

| Format | Keyboard Shortcut | Markdown Syntax |
|--------|-------------------|-----------------|
| **Bold** | `Ctrl+B` | `**text**` |
| *Italic* | `Ctrl+I` | `*text*` or `_text_` |
| Underline | `Ctrl+U` | — |
| ~~Strikethrough~~ | `Ctrl+Shift+S` | `~~text~~` |
| `Inline Code` | `Ctrl+E` | `` `text` `` |
| Highlight | `Ctrl+Shift+H` | `==text==` |
| Link | `Ctrl+K` | `[text](url)` |
| Superscript | — | `^text^` |
| Subscript | — | `~text~` |
| ***Bold Italic*** | — | `***text***` |

**Highlight Colors**: Yellow, Green, Blue, Pink, Purple, Orange, Red, Gray

### Slash Menu

Type `/` in an empty block to open the command menu with search/filtering:

**Basic Blocks**: Text, Heading 1-3, Bullet List, Numbered List, To-do List, Callout, Code, Quote, Divider, Math Equation, Diagram, Table, Table of Contents

**Media**: Image, Video, File

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle bold |
| `Ctrl+I` | Toggle italic |
| `Ctrl+U` | Toggle underline |
| `Ctrl+K` | Create/edit link |
| `Ctrl+E` | Toggle inline code |
| `Ctrl+Shift+S` | Toggle strikethrough |
| `Ctrl+Shift+H` | Toggle highlight |
| `Ctrl+A` | Select all blocks |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Enter` | Create new block / continue list |
| `Shift+Enter` / `Ctrl+Enter` | Exit code/math/diagram block |
| `Backspace` | Delete empty block / merge with previous |
| `Arrow Up/Down` | Navigate between blocks |
| `Escape` | Clear selection / exit editing |

### Table Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next cell |
| `Shift+Tab` | Previous cell |
| `Enter` | Next row |
| `Ctrl+Down` | Add row below |
| `Ctrl+Right` | Add column right |

### Floating Toolbar (on text selection)

- Block type conversion: Text, H1, H2, H3, Bullet, Numbered, Todo, Quote, Callout
- Text alignment: Left, Center, Right, Justify
- Inline formatting: Bold, Italic, Underline, Strikethrough, Code, Highlight (color picker), Link

### Block Context Menu (right-click / drag handle)

- Delete block
- Duplicate block
- Turn Into (convert block type)
- Move Up / Move Down
- Drag & drop reordering

### Media Blocks

**Images**: Upload or embed URL, resizable, captionable, alignment (left/center/right)

**Videos**: Upload or embed URL, auto-detects YouTube, Vimeo, Loom, Dailymotion, 16:9 aspect ratio

**Files**: Upload or link, displays name/size/type with download option

### Table Features

- Add/remove rows and columns, insert above/below/left/right
- Resizable columns via drag handles
- Header row toggle
- Cell alignment, rich text in cells
- Auto-add row on Enter at last cell

### Code Block Features

- 300+ languages via PrismJS with syntax highlighting (Tomorrow Night theme)
- Line numbers, tab indentation
- Edit/Preview toggle

### Math Block Features (KaTeX)

- Full LaTeX support, block-level (`$$...$$`) and inline (`$...$`)
- Edit/Preview toggle, error display

### Diagram Features (Mermaid)

- Flowcharts, sequence, class, state, Gantt diagrams
- Auto-conversion from `sequence`/`flow` syntax
- Edit/Preview toggle, syntax sanitization, PlantUML support

### Emoji Autocomplete

- Type `:` to trigger picker (100+ shortcodes across 8 categories)
- Filter by name, arrow key navigation, Enter/Tab to select

### Page Features

- Page title, page icon (emoji), page cover image
- Word count & character count
- Preview mode (read-only)
- Focus mode (distraction-free)
- Dark mode / Light mode
- Auto-save with status indicator (saving/saved/unsaved)
- Clear all content (with confirmation)
- Export as Markdown (.md file download)

---

## Part 2: Markdown Import Features

### Supported Syntax

**Headings**: `#`, `##`, `###` (ATX style, H4-H6 mapped to H3), setext (`===`, `---`)

**Lists**: `-`, `*`, `+` bullets; `1.` numbered; `- [ ]` / `- [x]` tasks; nested/indented; continuation lines

**Text Formatting**:
- **Bold**: `**text**`, `__text__`
- *Italic*: `*text*`, `_text_`
- ***Bold Italic***: `***text***`, `___text___`
- ~~Strikethrough~~: `~~text~~`
- ==Highlight==: `==text==`
- Superscript: `^text^`, Subscript: `~text~`
- `Inline code`: `` `text` ``

**Links & References**: `[text](url)` inline, `[text][ref]` reference, `[text][]` shorthand, bare URL autolinking, `<https://url>` angle brackets

**Block Quotes**: `>` single level, `>>` nested

**Code Blocks**: ` ``` ` or `~~~` fenced with language tag, 300+ language detection

**Math**: Block `$$...$$`, inline `$...$`

**Diagrams**: ` ```mermaid `, ` ```sequence ` (auto-converted), ` ```flow ` (auto-converted), PlantUML `@startuml...@enduml`

**Tables**: Pipe-delimited `| col | col |`, alignment `:---` / `---:` / `:---:`

**Images & Media**: `![alt](url)`, linked images `[![alt](thumb)](url)`, YouTube auto-detection, `{%youtube ID%}`, `<iframe>`

**Callouts**: `:::info` / `:::warning` / `:::danger` with `:::`

**Dividers**: `---`, `***`, `___`

**Footnotes**: `[^1]` reference, `[^1]: text` definition

**Definition Lists**: `Term` followed by `: definition`

**Emoji**: `:smile:`, `:rocket:`, etc. (100+ supported)

**HTML Elements**: `<br>`, `<center>`, `<details>`, `<summary>`, `<div>`, `<iframe>`, `<kbd>`, `<mark>`, `<sub>`, `<sup>`

**Font Awesome**: `<i class="fa fa-icon"></i>` converted to Unicode (26 icons mapped)

**HackMD**: `[TOC]`, `[color=...]`, `{%youtube%}`

### Parsing Test Results (36 files)

| Metric | Result |
|--------|--------|
| Total files tested | 36 |
| Files passed | 36 (100%) |
| Total blocks generated | 1,835 |
| Errors / Warnings | 0 |

---

## Part 3: Public API & Integration

### Installation

```bash
npm install @amplecapitalglobal/editor
# or
pnpm add @amplecapitalglobal/editor
# or
yarn add @amplecapitalglobal/editor
```

No CSS import required — styles are auto-injected when the component mounts.

### CDN Dependencies

Add these to your `index.html` for full functionality (math, diagrams, code highlighting):

```html
<!-- KaTeX (Math) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>

<!-- Mermaid (Diagrams) -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>

<!-- PrismJS (Code Highlighting) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" />
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css" />
```

### Exports

```typescript
// Main Component
import { Editor } from "@amplecapitalglobal/editor";
import type { EditorProps } from "@amplecapitalglobal/editor";

// Types & Helpers
import type { Block, BlockType } from "@amplecapitalglobal/editor";
import { createBlock, initialBlocks, generateUUID } from "@amplecapitalglobal/editor";

// Converters
import { blocksToHtml, blocksToMarkdown, markdownToBlocks } from "@amplecapitalglobal/editor";
```

### EditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialBlocks` | `Block[]` | `[]` | Initial blocks to display |
| `onChange` | `(blocks: Block[]) => void` | — | Callback on content change |
| `useLocalStorage` | `boolean` | `false` | Enable localStorage auto-save |
| `storageKey` | `string` | `"editor-content"` | localStorage key |
| `readOnly` | `boolean` | `false` | Read-only/preview mode |
| `className` | `string` | — | Custom CSS class for container |
| `showPageMenu` | `boolean` | `true` | Show page menu (export/import) |
| `onExportMarkdown` | `(markdown: string) => void` | — | Custom export handler |
| `onExportHtml` | `(html: string) => void` | — | Custom HTML export handler |
| `onImportMarkdown` | `(markdown: string) => void` | — | Custom import handler |

### Block Interface

```typescript
type BlockType =
  | "text" | "heading-1" | "heading-2" | "heading-3"
  | "bullet-list" | "numbered-list" | "todo"
  | "quote" | "divider" | "callout"
  | "image" | "video" | "file" | "table";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  metadata?: Record<string, any>;
  props?: { textColor?: string; backgroundColor?: string; textAlign?: string; [key: string]: any };
}
```

### Converter Functions

```typescript
import { blocksToMarkdown, blocksToHtml, markdownToBlocks } from "@amplecapitalglobal/editor";

const markdown = blocksToMarkdown(blocks);  // Blocks → Markdown
const html = blocksToHtml(blocks);          // Blocks → HTML
const blocks = markdownToBlocks(mdString);  // Markdown → Blocks
```

### Basic Usage

```tsx
import { useState } from "react";
import { Editor, Block } from "@amplecapitalglobal/editor";

function App() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  return (
    <Editor
      initialBlocks={blocks}
      onChange={setBlocks}
    />
  );
}
```

### Read-Only Preview

```tsx
function ArticleView({ blocks }: { blocks: Block[] }) {
  return <Editor initialBlocks={blocks} readOnly showPageMenu={false} />;
}
```

### Saving to Database

```tsx
import { Editor, Block, blocksToMarkdown, blocksToHtml } from "@amplecapitalglobal/editor";

function EditorWithSave() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const handleSave = async () => {
    await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Article",
        contentJson: JSON.stringify(blocks),
        contentMarkdown: blocksToMarkdown(blocks),
        contentHtml: blocksToHtml(blocks),
      }),
    });
  };

  return (
    <div>
      <Editor blocks={blocks} onChange={setBlocks} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Loading Saved Content

```tsx
const loadArticle = async (articleId: number) => {
  const res = await fetch(`/api/articles/${articleId}`);
  const article = await res.json();
  setBlocks(JSON.parse(article.contentJson));
};
```

### Importing Markdown

```tsx
import { markdownToBlocks } from "@amplecapitalglobal/editor";

const importMarkdown = (markdownString: string) => {
  setBlocks(markdownToBlocks(markdownString));
};
```

### Content Storage Formats

| Format | Use Case | Column Type |
|--------|----------|-------------|
| **JSON** | Re-editing in editor (preserves all block types, metadata, tables) | `NVARCHAR(MAX)` |
| **Markdown** | Portable text, version control, external rendering | `NVARCHAR(MAX)` |
| **HTML** | Display-only views, email rendering, read-only pages | `NVARCHAR(MAX)` |

> Always save JSON for re-editing. Markdown and HTML are optional depending on read requirements.

---

## Part 4: .NET Core API Integration

### SQL Server Schema

#### Articles Table

```sql
CREATE TABLE [dbo].[Articles] (
    [Id]               INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Title]            NVARCHAR(500)    NOT NULL,
    [Slug]             NVARCHAR(500)    NULL,
    [ContentJson]      NVARCHAR(MAX)    NOT NULL,
    [ContentMarkdown]  NVARCHAR(MAX)    NULL,
    [ContentHtml]      NVARCHAR(MAX)    NULL,
    [AuthorId]         INT              NULL,
    [Status]           NVARCHAR(50)     NOT NULL DEFAULT 'draft',
    [Tags]             NVARCHAR(MAX)    NULL,
    [FeaturedImage]    NVARCHAR(1000)   NULL,
    [CreatedAt]        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    [PublishedAt]      DATETIME2        NULL,
);

CREATE UNIQUE INDEX IX_Articles_Slug ON [dbo].[Articles] (Slug) WHERE Slug IS NOT NULL;
CREATE INDEX IX_Articles_Status_Date ON [dbo].[Articles] (Status, PublishedAt DESC);
```

#### Media Attachments Table (Optional)

```sql
CREATE TABLE [dbo].[MediaAttachments] (
    [Id]          INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ArticleId]   INT              NOT NULL FOREIGN KEY REFERENCES [dbo].[Articles](Id),
    [FileName]    NVARCHAR(500)    NOT NULL,
    [FileType]    NVARCHAR(100)    NOT NULL,
    [FileSize]    BIGINT           NOT NULL,
    [Url]         NVARCHAR(2000)   NOT NULL,
    [UploadedAt]  DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
);
```

### .NET Core Web API Setup

```bash
dotnet new webapi -n ArticleApi
cd ArticleApi
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
```

### Article Model

```csharp
// Models/Article.cs
namespace ArticleApi.Models;

public class Article
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string ContentJson { get; set; } = "[]";
    public string? ContentMarkdown { get; set; }
    public string? ContentHtml { get; set; }
    public int? AuthorId { get; set; }
    public string Status { get; set; } = "draft";
    public string? Tags { get; set; }
    public string? FeaturedImage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
}
```

### DTOs

```csharp
// DTOs/ArticleDtos.cs
namespace ArticleApi.DTOs;

public class CreateArticleDto
{
    public string Title { get; set; } = string.Empty;
    public string ContentJson { get; set; } = "[]";
    public string? ContentMarkdown { get; set; }
    public string? ContentHtml { get; set; }
    public string? Tags { get; set; }
    public string? FeaturedImage { get; set; }
}

public class UpdateArticleDto
{
    public string? Title { get; set; }
    public string? ContentJson { get; set; }
    public string? ContentMarkdown { get; set; }
    public string? ContentHtml { get; set; }
    public string? Status { get; set; }
    public string? Tags { get; set; }
    public string? FeaturedImage { get; set; }
}

public class ArticleResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string ContentJson { get; set; } = "[]";
    public string? ContentMarkdown { get; set; }
    public string? ContentHtml { get; set; }
    public string Status { get; set; } = "draft";
    public string? Tags { get; set; }
    public string? FeaturedImage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
```

### DbContext

```csharp
// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using ArticleApi.Models;

namespace ArticleApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Article> Articles => Set<Article>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
            entity.HasIndex(e => new { e.Status, e.PublishedAt });
        });
    }
}
```

### Articles Controller

```csharp
// Controllers/ArticlesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArticleApi.Data;
using ArticleApi.Models;
using ArticleApi.DTOs;
using System.Text.RegularExpressions;

namespace ArticleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ArticlesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ArticleResponseDto>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Articles.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        var articles = await query
            .OrderByDescending(a => a.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleResponseDto
            {
                Id = a.Id, Title = a.Title, Slug = a.Slug,
                ContentJson = a.ContentJson, ContentMarkdown = a.ContentMarkdown,
                ContentHtml = a.ContentHtml, Status = a.Status, Tags = a.Tags,
                FeaturedImage = a.FeaturedImage, CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt, PublishedAt = a.PublishedAt,
            })
            .ToListAsync();

        return Ok(articles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ArticleResponseDto>> GetById(int id)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article == null) return NotFound();
        return Ok(new ArticleResponseDto
        {
            Id = article.Id, Title = article.Title, Slug = article.Slug,
            ContentJson = article.ContentJson, ContentMarkdown = article.ContentMarkdown,
            ContentHtml = article.ContentHtml, Status = article.Status, Tags = article.Tags,
            FeaturedImage = article.FeaturedImage, CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt, PublishedAt = article.PublishedAt,
        });
    }

    [HttpPost]
    public async Task<ActionResult<ArticleResponseDto>> Create(CreateArticleDto dto)
    {
        var article = new Article
        {
            Title = dto.Title, Slug = GenerateSlug(dto.Title),
            ContentJson = dto.ContentJson, ContentMarkdown = dto.ContentMarkdown,
            ContentHtml = dto.ContentHtml, Tags = dto.Tags, FeaturedImage = dto.FeaturedImage,
        };
        _db.Articles.Add(article);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = article.Id }, new ArticleResponseDto
        {
            Id = article.Id, Title = article.Title, Slug = article.Slug,
            ContentJson = article.ContentJson, ContentMarkdown = article.ContentMarkdown,
            ContentHtml = article.ContentHtml, Status = article.Status, Tags = article.Tags,
            FeaturedImage = article.FeaturedImage, CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateArticleDto dto)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article == null) return NotFound();

        if (dto.Title != null) { article.Title = dto.Title; article.Slug = GenerateSlug(dto.Title); }
        if (dto.ContentJson != null) article.ContentJson = dto.ContentJson;
        if (dto.ContentMarkdown != null) article.ContentMarkdown = dto.ContentMarkdown;
        if (dto.ContentHtml != null) article.ContentHtml = dto.ContentHtml;
        if (dto.Status != null)
        {
            article.Status = dto.Status;
            if (dto.Status == "published" && article.PublishedAt == null)
                article.PublishedAt = DateTime.UtcNow;
        }
        if (dto.Tags != null) article.Tags = dto.Tags;
        if (dto.FeaturedImage != null) article.FeaturedImage = dto.FeaturedImage;
        article.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article == null) return NotFound();
        _db.Articles.Remove(article);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');
        return slug.Length > 200 ? slug[..200] : slug;
    }
}
```

### Program.cs

```csharp
using Microsoft.EntityFrameworkCore;
using ArticleApi.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### Connection String

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ArticleDb;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### Run Migrations

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Media Upload Endpoint (Optional)

```csharp
[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    public MediaController(IWebHostEnvironment env) => _env = env;

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file.Length == 0) return BadRequest("Empty file");
        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
        return Ok(new { url = $"/uploads/{fileName}", fileName = file.FileName, fileSize = file.Length, fileType = file.ContentType });
    }
}
```

### Displaying Saved Content (Read-Only)

**Option A: Render HTML directly**
```tsx
function ArticleView({ htmlContent }: { htmlContent: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
```

**Option B: Editor in read-only mode**
```tsx
function ArticleView({ jsonContent }: { jsonContent: string }) {
  return <Editor initialBlocks={JSON.parse(jsonContent)} readOnly />;
}
```

**Option C: .NET Razor/Blazor (server-side)**
```html
@model Article
<article class="prose">
    @Html.Raw(Model.ContentHtml)
</article>
```

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List articles (`?status=`, `?page=`) |
| GET | `/api/articles/{id}` | Get single article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |
| POST | `/api/media/upload` | Upload media file |

---

## Part 5: Tech Stack & Build

### Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18/19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| @dnd-kit | Drag-and-drop |
| Radix UI | Accessible UI primitives |
| Lucide React | Icons |
| re-resizable | Media resize handles |
| Sonner | Toast notifications |
| KaTeX (CDN) | LaTeX math rendering |
| Mermaid (CDN) | Diagram rendering |
| PrismJS (CDN) | Code syntax highlighting |
| esbuild | Bundling (ESM + CJS + app) |
| Express | Dev/production server |

### Build Outputs

| Output | Path | Format | Purpose |
|--------|------|--------|---------|
| Library ESM | `dist/index.mjs` | ES Module | npm import |
| Library CJS | `dist/index.cjs` | CommonJS | npm require |
| Type declarations | `dist/index.d.ts` | TypeScript | Type safety |
| App bundle | `dist/public/index.js` | Browser JS | Standalone app |
| App CSS | `dist/public/style.css` | CSS | Standalone app |
| App HTML | `dist/public/index.html` | HTML | Standalone app |
| Server | `dist/index.js` | Node ESM | Express server |

### Development

```bash
pnpm install     # Install dependencies
pnpm dev         # Run dev server (localhost:3000)
pnpm build       # Build library + app
pnpm check       # TypeScript type check
```
