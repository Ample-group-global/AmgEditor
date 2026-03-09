# AMG Editor - .NET Core API Integration Guide

## Overview

This guide explains how to integrate `@amplecapitalglobal/editor` into any React project and save editor content to a SQL Server database via a .NET Core Web API.

---

## 1. Install the Editor Package

```bash
npm install @amplecapitalglobal/editor
```

No CSS import is required — styles are auto-injected when the component mounts.

---

## 2. Add CDN Dependencies

Add these scripts to your `index.html` (or `_Host.cshtml` / `_Layout.cshtml` for Blazor hybrid):

```html
<!-- KaTeX (Math Rendering) -->
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

---

## 3. Use the Editor in Your React App

```tsx
import { useState } from "react";
import { Editor, Block, blocksToMarkdown, blocksToHtml } from "@amplecapitalglobal/editor";

function ArticleEditor() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const handleSave = async () => {
    const jsonContent = JSON.stringify(blocks);
    const markdownContent = blocksToMarkdown(blocks);
    const htmlContent = blocksToHtml(blocks);

    const response = await fetch("https://your-api.com/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Article",
        contentJson: jsonContent,
        contentMarkdown: markdownContent,
        contentHtml: htmlContent,
      }),
    });

    if (response.ok) {
      console.log("Saved successfully");
    }
  };

  return (
    <div>
      <Editor
        blocks={blocks}
        onChange={setBlocks}
        darkMode={false}
      />
      <button onClick={handleSave}>Save Article</button>
    </div>
  );
}
```

### Loading Saved Content Back Into the Editor

```tsx
// Load from JSON (preserves full editor state)
const loadArticle = async (articleId: number) => {
  const res = await fetch(`https://your-api.com/api/articles/${articleId}`);
  const article = await res.json();
  const blocks: Block[] = JSON.parse(article.contentJson);
  setBlocks(blocks);
};
```

### Importing Markdown Into the Editor

```tsx
import { markdownToBlocks } from "@amplecapitalglobal/editor";

const importMarkdown = (markdownString: string) => {
  const blocks = markdownToBlocks(markdownString);
  setBlocks(blocks);
};
```

---

## 4. Content Storage Formats

The editor supports three export formats. Store all three for maximum flexibility:

| Format | Use Case | Column Type |
|--------|----------|-------------|
| **JSON** | Re-editing in the editor (preserves all block types, metadata, table data) | `NVARCHAR(MAX)` |
| **Markdown** | Portable text format, version control, external rendering | `NVARCHAR(MAX)` |
| **HTML** | Display-only views, email rendering, read-only pages | `NVARCHAR(MAX)` |

**Recommendation:** Always save JSON for re-editing. Markdown and HTML are optional depending on your read requirements.

---

## 5. SQL Server Database Schema

### Articles Table

```sql
CREATE TABLE [dbo].[Articles] (
    [Id]               INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Title]            NVARCHAR(500)    NOT NULL,
    [Slug]             NVARCHAR(500)    NULL,
    [ContentJson]      NVARCHAR(MAX)    NOT NULL,   -- Editor block state (for re-editing)
    [ContentMarkdown]  NVARCHAR(MAX)    NULL,        -- Markdown export
    [ContentHtml]      NVARCHAR(MAX)    NULL,        -- HTML export
    [AuthorId]         INT              NULL,
    [Status]           NVARCHAR(50)     NOT NULL DEFAULT 'draft',  -- draft, published, archived
    [Tags]             NVARCHAR(MAX)    NULL,        -- JSON array of tags
    [FeaturedImage]    NVARCHAR(1000)   NULL,
    [CreatedAt]        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    [PublishedAt]      DATETIME2        NULL,
);

-- Index for slug lookups
CREATE UNIQUE INDEX IX_Articles_Slug ON [dbo].[Articles] (Slug) WHERE Slug IS NOT NULL;

-- Index for listing by status and date
CREATE INDEX IX_Articles_Status_Date ON [dbo].[Articles] (Status, PublishedAt DESC);
```

### Media Attachments Table (Optional)

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

---

## 6. .NET Core Web API

### 6.1 Create the Project

```bash
dotnet new webapi -n ArticleApi
cd ArticleApi
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
```

### 6.2 Article Model

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

### 6.3 DTOs

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

### 6.4 DbContext

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

### 6.5 Articles Controller

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

    // GET api/articles
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
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                ContentJson = a.ContentJson,
                ContentMarkdown = a.ContentMarkdown,
                ContentHtml = a.ContentHtml,
                Status = a.Status,
                Tags = a.Tags,
                FeaturedImage = a.FeaturedImage,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                PublishedAt = a.PublishedAt,
            })
            .ToListAsync();

        return Ok(articles);
    }

    // GET api/articles/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ArticleResponseDto>> GetById(int id)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article == null) return NotFound();

        return Ok(new ArticleResponseDto
        {
            Id = article.Id,
            Title = article.Title,
            Slug = article.Slug,
            ContentJson = article.ContentJson,
            ContentMarkdown = article.ContentMarkdown,
            ContentHtml = article.ContentHtml,
            Status = article.Status,
            Tags = article.Tags,
            FeaturedImage = article.FeaturedImage,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
            PublishedAt = article.PublishedAt,
        });
    }

    // POST api/articles
    [HttpPost]
    public async Task<ActionResult<ArticleResponseDto>> Create(CreateArticleDto dto)
    {
        var article = new Article
        {
            Title = dto.Title,
            Slug = GenerateSlug(dto.Title),
            ContentJson = dto.ContentJson,
            ContentMarkdown = dto.ContentMarkdown,
            ContentHtml = dto.ContentHtml,
            Tags = dto.Tags,
            FeaturedImage = dto.FeaturedImage,
        };

        _db.Articles.Add(article);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = article.Id }, new ArticleResponseDto
        {
            Id = article.Id,
            Title = article.Title,
            Slug = article.Slug,
            ContentJson = article.ContentJson,
            ContentMarkdown = article.ContentMarkdown,
            ContentHtml = article.ContentHtml,
            Status = article.Status,
            Tags = article.Tags,
            FeaturedImage = article.FeaturedImage,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
        });
    }

    // PUT api/articles/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateArticleDto dto)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article == null) return NotFound();

        if (dto.Title != null)
        {
            article.Title = dto.Title;
            article.Slug = GenerateSlug(dto.Title);
        }
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

    // DELETE api/articles/5
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

### 6.6 Program.cs Configuration

```csharp
// Program.cs
using Microsoft.EntityFrameworkCore;
using ArticleApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS - Allow your React app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### 6.7 Connection String

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ArticleDb;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### 6.8 Run Migrations

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## 7. Complete React Integration Example

```tsx
import { useState, useEffect } from "react";
import { Editor, Block, blocksToMarkdown, blocksToHtml, markdownToBlocks } from "@amplecapitalglobal/editor";

const API_BASE = "https://localhost:5001/api";

interface ArticleData {
  id: number;
  title: string;
  contentJson: string;
  contentMarkdown?: string;
  contentHtml?: string;
  status: string;
}

export function ArticleEditor({ articleId }: { articleId?: number }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing article
  useEffect(() => {
    if (articleId) {
      fetch(`${API_BASE}/articles/${articleId}`)
        .then(res => res.json())
        .then((data: ArticleData) => {
          setTitle(data.title);
          setBlocks(JSON.parse(data.contentJson));
        });
    }
  }, [articleId]);

  // Save article
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        contentJson: JSON.stringify(blocks),
        contentMarkdown: blocksToMarkdown(blocks),
        contentHtml: blocksToHtml(blocks),
      };

      if (articleId) {
        await fetch(`${API_BASE}/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch(`${API_BASE}/articles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        // Navigate to edit URL with new ID
        window.history.pushState({}, "", `/editor/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Import markdown file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const md = reader.result as string;
      setBlocks(markdownToBlocks(md));
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Article title..."
          style={{ flex: 1, fontSize: 18, padding: 8 }}
        />
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <label style={{ cursor: "pointer", padding: "8px 16px", background: "#eee", borderRadius: 4 }}>
          Import .md
          <input type="file" accept=".md" onChange={handleImport} hidden />
        </label>
      </div>

      <Editor blocks={blocks} onChange={setBlocks} />
    </div>
  );
}
```

---

## 8. Displaying Saved Content (Read-Only)

### Option A: Render HTML directly

```tsx
function ArticleView({ htmlContent }: { htmlContent: string }) {
  return (
    <div
      className="article-content prose"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
```

### Option B: Render in the editor (read-only mode)

```tsx
function ArticleView({ jsonContent }: { jsonContent: string }) {
  const blocks = JSON.parse(jsonContent);
  return <Editor blocks={blocks} onChange={() => {}} readOnly />;
}
```

### Option C: Render in .NET Razor/Blazor (server-side)

```html
<!-- Use the HTML content directly in a Razor view -->
@model Article
<article class="prose">
    @Html.Raw(Model.ContentHtml)
</article>
```

---

## 9. Media Upload Endpoint (Optional)

If your editor uses image/video/file uploads, add a media upload endpoint:

```csharp
// Controllers/MediaController.cs
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

        return Ok(new
        {
            url = $"/uploads/{fileName}",
            fileName = file.FileName,
            fileSize = file.Length,
            fileType = file.ContentType,
        });
    }
}
```

---

## 10. Quick Start Checklist

1. `npm install @amplecapitalglobal/editor` in your React project
2. Add CDN scripts (KaTeX, Mermaid, PrismJS) to `index.html`
3. Import `Editor`, `Block`, `blocksToMarkdown`, `blocksToHtml` from the package
4. Use `<Editor blocks={blocks} onChange={setBlocks} />` — no CSS import needed
5. Create the SQL Server `Articles` table with `NVARCHAR(MAX)` columns
6. Build the .NET Core API with CRUD endpoints
7. POST `{ contentJson, contentMarkdown, contentHtml }` to save
8. Load articles by parsing `contentJson` back into blocks
9. Display articles using `contentHtml` or the editor in read-only mode

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List articles (supports `?status=` and `?page=`) |
| GET | `/api/articles/{id}` | Get single article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |
| POST | `/api/media/upload` | Upload media file |
