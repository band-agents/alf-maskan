// Pull the Claude Design project's source files down to your Downloads folder.
//
// USE THIS WHEN the DesignSync MCP is unauthorised and the Claude Chrome
// extension is not connected — it needs neither. It only needs a browser tab
// that is already signed in to claude.ai.
//
// HOW TO RUN
//   1. Open the project:
//      https://claude.ai/design/p/e5526955-da5c-4cd3-9056-aec2865e8aff
//   2. F12 (or Ctrl+Shift+J) to open DevTools, click the Console tab.
//   3. Paste this whole file, press Enter.
//   4. Chrome may ask to "Download multiple files" — click Allow.
//   5. Tell Claude Code it's done; the files land in C:\Users\DANNN\Downloads
//      with lowercase hyphenated names, e.g. aqarly-dashboard.dc.html.
//
// It calls the same RPC the Design editor itself uses, so it always fetches the
// current saved version — no export step, no copy-paste of large files.

(async () => {
  const PROJECT_ID = 'e5526955-da5c-4cd3-9056-aec2865e8aff';
  const RPC = 'https://claude.ai/design/anthropic.omelette.api.v1alpha.OmeletteService/';

  const call = (method, body) =>
    fetch(RPC + method, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error(method + ' failed: HTTP ' + r.status);
      return r.json();
    });

  const { entries } = await call('ListFiles', { projectId: PROJECT_ID });
  console.log('Files in this project:');
  console.table(entries.map((e) => ({ name: e.name, bytes: Number(e.size) })));

  // Source files only — skip .thumbnail and any other binary artefacts.
  const wanted = entries.filter((e) => /\.(dc\.html|js|css|json)$/i.test(e.name));

  for (const entry of wanted) {
    const { content } = await call('GetFile', { projectId: PROJECT_ID, path: entry.path });
    const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
    const localName = entry.name.replace(/\s+/g, '-').toLowerCase();

    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = localName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log('saved', localName, bytes.length, 'bytes');

    // Chrome throttles rapid programmatic downloads; give each one room.
    await new Promise((r) => setTimeout(r, 1200));
    URL.revokeObjectURL(url);
  }

  console.log('Done — ' + wanted.length + ' file(s) in your Downloads folder.');
})();
