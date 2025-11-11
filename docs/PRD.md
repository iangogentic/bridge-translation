# Bridge — PRD (Lean, Agent‑Ready)

**Version:** 2.1 (Resend MCP build)  
**Owner:** Bridge Product  
**Date:** Nov 11, 2025  
**Stack:** Next.js • Neon Postgres (+ Neon MCP) • Better Auth • OpenAI (gpt‑4o) • Resend (via MCP) • Vercel CLI  
**Goal:** Deliver fast, trustworthy translation + plain‑language summaries for official documents with an agent‑friendly pipeline.

---

## 0) TL;DR
Upload a PDF/photo → one **OpenAI gpt‑4o** call (File Inputs + Structured Output) → **Translated HTML** + **Action Summary** → export/share.  
Operationally, the app is deployable via **Vercel CLI**, stores results in **Neon Postgres**, authenticates with **Better Auth**, and sends product emails via **Resend MCP** tools (agent‑ready).

---

## 1) Product Summary
**Value prop:** *Official documents, made simple.*  
**Users:** Immigrant families (Parent + Helper), later schools/clinics.  
**MVP promise:** “Understand what to do by when” in under a minute; P50 end‑to‑end ≤ 2s for 1–3 page typed docs.

---

## 2) Outcomes & Success Criteria
- **Time‑to‑clarity:** Median time from upload → summary view ≤ **60s**.  
- **Latency:** P50 total ≤ **2s**, P95 ≤ **6s** for 1–3 page typed docs.  
- **Trust:** Zero document content in logs; clear privacy note near upload.  
- **Activation:** ≥ 60% new users complete 1 translation in first session.

---

## 3) Scope (MVP → Phase 2)
### MVP
1) **Upload & View** — PDF/JPG/PNG; tabs: **Original | Translated | Summary**.  
2) **Translate & Summarize** — Single call to `gpt‑4o` with **File Inputs** + **Structured Output** JSON:  
   ```json
   {
     "translation_html": "…",
     "summary": {
       "purpose": "…",
       "actions": ["…"],
       "due_dates": ["…"],
       "costs": ["…"]
     },
     "detected_language": "vi"
   }
   ```
3) **Export & Share** — Export translated HTML→PDF (headless Chromium); create time‑boxed share link.  
4) **Family Collaboration** — Invite **Helper** by email; revoke anytime.  
5) **Auth** — **Better Auth** (email magic link).  
6) **Email** — **Resend via MCP** (send magic links + notifications).

### Phase 2 (post‑MVP)
- Pricing (Stripe), org portal (SSO/SCIM), retention, redaction, batch/API ingestion, Sentry, Cloudflare Turnstile.

**Out of scope (MVP):** HIPAA claim, handwriting excellence, e‑sign.

---

## 4) Architecture (Lean)
- **App:** Next.js (App Router, TS) on **Vercel**.  
- **Auth:** **Better Auth** magic links; transport: **Resend MCP** (`sendEmail` tool).  
- **DB:** **Neon Postgres**; **Neon MCP** is available for secure DB ops during development/ops; app uses a standard Postgres client (Drizzle/Prisma).  
- **Inference:** **OpenAI gpt‑4o** (Responses API) with File Inputs + Structured Outputs (`store:false`).  
- **Storage:** Vercel Blob for uploads (MVP 24–48h retention); upgrade to S3/R2 later.  
- **Export:** Playwright/Chromium to print translated HTML → PDF (serverless function).  
- **Observability:** Vercel logs (no content).

### Request Sequence
1) Client uploads → Blob URL.  
2) Server: call OpenAI (`gpt‑4o`) with file ref + strict JSON schema.  
3) Store `{translation_html, summary_json, lang}` in Neon.  
4) Render two‑pane reader; allow export/share.  
5) Emails (magic link / notifications): invoke **Resend MCP** tool from server action/route handler.

---

## 5) MCP Usage
### Resend MCP
- **Tools (examples):** `sendEmail`, `sendTemplatedEmail`, `health`.  
- **Usage:** Server‑side call from Next route handler or background task to send magic links and notifications.  
- **Security:** Scope API token to least privilege; pin MCP server version/image; network‑isolate MCP in production; retry w/ backoff.

### Neon MCP
- **Purpose:** Safe DB ops in dev/ops (schema migrations, data checks) via agent workflows.  
- **App Path:** The app itself uses a normal Postgres client; MCP is not required for runtime reads/writes.

---

## 6) Data Model (Minimum)
- **users**(id, email, created_at)  
- **families**(id, owner_id), **family_members**(family_id, user_id, role)  
- **documents**(id, owner_id, blob_uri, pages, size, created_at)  
- **results**(id, document_id, translation_html, summary_json, lang, confidence)  
- **shares**(id, document_id, token, expires_at, can_download)

---

## 7) API Surface (Tiny)
```
POST /api/translate         # { fileUrl, targetLang, domain }
GET  /api/doc/:id           # { meta, hasResult }
GET  /api/doc/:id/result    # { translation_html, summary_json, lang }
POST /api/doc/:id/export    # { format: pdf|json|txt }
POST /api/share             # { docId, ttl }
POST /api/auth/magic-link   # invokes Resend MCP sendEmail
```

---

## 8) Prompts (Condensed)
**System:** “Domain‑aware translator for school/healthcare/legal/government docs. Preserve structure in HTML (headings, lists, tables). Keep dates, amounts, names exact. Expand acronyms on first mention. Summaries contain: purpose, actions, due_dates, costs. Return only JSON matching the schema.”

**Schema (strict):**
```json
{
  "type": "object",
  "properties": {
    "translation_html": {"type":"string"},
    "summary": {
      "type":"object",
      "properties": {
        "purpose":{"type":"string"},
        "actions":{"type":"array","items":{"type":"string"}},
        "due_dates":{"type":"array","items":{"type":"string"}},
        "costs":{"type":"array","items":{"type":"string"}}
      },
      "required":["purpose","actions"]
    },
    "detected_language":{"type":"string"}
  },
  "required":["translation_html","summary","detected_language"]
}
```

---

## 9) UX (High‑Level)
- **Upload card → progress → results** with tabs **Original | Translated | Summary**.  
- **Summary bullets** each “jump to source” in the document.  
- **Mobile‑first**; WCAG 2.2 AA (visible focus, 24×24 targets, high contrast).  
- **Copy tone:** short, plain language; precise for legal/medical terms.

---

## 10) Security & Privacy
- TLS; Vercel encrypted env; least‑privilege Neon roles.  
- **No document content in logs**; OpenAI `store:false`; signed, time‑boxed share links.  
- MCP servers are pinned, isolated, and token‑scoped.  
- Publish clear privacy note at upload.

---

## 11) Env & Commands
**.env**
```
OPENAI_API_KEY=...
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
RESEND_MCP_ENDPOINT=https://<your-mcp-host>
RESEND_MCP_TOKEN=...
VERCEL_PROJECT_ID=...
```

**Dev**
```bash
vercel dev
```

**Deploy**
```bash
vercel deploy --prod
```

---

## 12) Acceptance Criteria (MVP)
- 3‑page typed PDF → translated HTML + correct summary in **≤ 2s P50 / ≤ 6s P95**.  
- Exported PDF preserves headings, lists, tables.  
- Magic‑link email delivered (Resend MCP) under 5s median.  
- Invite Helper + revoke works and is audited.  
- Logs contain **no** document content.

---

## 13) Risks & Mitigations
- **MCP availability:** If Resend MCP is down, fallback to direct Resend API/SMTP (feature flag).  
- **Accuracy drift:** Seed domain glossaries; evaluate on held‑out docs; show “Review suggested” on low confidence.  
- **Abuse:** Antivirus on upload, file allow‑list, rate limits, Turnstile (Phase 2).  
- **Compliance:** Don’t claim HIPAA until BAAs + risk analysis + policies complete.

---

## 14) Roadmap (4‑week MVP)
- **W1:** Vertical slice (upload → gpt‑4o → render).  
- **W2:** Better Auth + Resend MCP magic links; export PDF.  
- **W3:** Share links, family invite/revoke; polish.  
- **W4:** Beta, QA on 50 real docs; public MVP.

---

## Appendix A — Example: Resend MCP invocation (pseudo)
```ts
// inside Next Route Handler
const mcptoken = process.env.RESEND_MCP_TOKEN;
await fetch(process.env.RESEND_MCP_ENDPOINT + "/tools/sendEmail", {
  method: "POST",
  headers: { Authorization: `Bearer ${mcptoken}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "no-reply@bridge.app",
    to: user.email,
    subject: "Sign in to Bridge",
    text: `Click to sign in: ${magicLinkUrl}`
  })
});
```

## Appendix B — Example: OpenAI Responses call (schema enforced)
```ts
const response = await openai.responses.create({
  model: "gpt-4o",
  input: [
    { role: "system", content: "You are a domain-aware translator ..." },
    { role: "user", content: [
        { type: "input_text", text: `Target language: ${targetLang}\nDomain: ${domain}` },
        { type: "input_image", image_url: fileUrl } // or Files API id
      ]
    }
  ],
  response_format: { type: "json_schema", json_schema: { name: "BridgeOutput", schema, strict: true } },
  store: false
});
```
