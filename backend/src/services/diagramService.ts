import { Resvg } from '@resvg/resvg-js';
import { AnalysisResult } from './analyzerService';

export interface DiagramResult {
  svg: string;
  pngBuffer: Buffer;
  description: string;
}

export async function generateProjectArchitecture(analysis: AnalysisResult): Promise<DiagramResult> {
  const { architecture, projectName } = analysis;
  const { nodes, edges, architectureType, architectureSummary } = architecture;

  const width = 960;
  const height = 480;

  // Modern corporate / technical color palette
  const colors = {
    client: { fill: '#1E1B4B', stroke: '#818CF8', badge: '#4F46E5', text: '#E0E7FF' },
    server: { fill: '#082F49', stroke: '#38BDF8', badge: '#0284C7', text: '#E0F2FE' },
    auth: { fill: '#311042', stroke: '#E879F9', badge: '#A855F7', text: '#FAE8FF' },
    firestore: { fill: '#143126', stroke: '#34D399', badge: '#059669', text: '#D1FAE5' },
    database: { fill: '#064E3B', stroke: '#10B981', badge: '#059669', text: '#ECFDF5' },
    fallback: { fill: '#1E293B', stroke: '#94A3B8', badge: '#475569', text: '#F1F5F9' },
  };

  function getNodeStyle(category: string) {
    if (category === 'client_ui') return colors.client;
    if (category === 'server_runtime') return colors.server;
    if (category === 'baas_auth') return colors.auth;
    if (category === 'baas_database') return colors.firestore;
    if (category === 'database') return colors.database;
    return colors.fallback;
  }

  let svgContent = '';

  // SVG Header & Defs
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D16" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
    </marker>
    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34D399" />
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#C084FC" />
    </marker>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" rx="14" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5" />

  <!-- Diagram Header -->
  <text x="36" y="44" font-family="Segoe UI, Roboto, sans-serif" font-size="18" font-weight="700" fill="#F8FAFC">
    ${escapeXml(projectName)} — Architecture Model
  </text>
  <text x="36" y="66" font-family="Segoe UI, Roboto, sans-serif" font-size="11.5" fill="#94A3B8">
    Evidence-derived components (${architectureType === 'client_baas' ? 'Client-Side BaaS Architecture' : architectureType === 'client_server_db' ? 'Client / Server / Database Architecture' : 'Single Page Application'})
  </text>
`;

  // Layout Strategy based on detected architecture type
  if (architectureType === 'client_baas') {
    // 2-Column / Branching Layout for Client-Side BaaS (e.g. React -> Firebase Auth & Cloud Firestore)
    const clientNode = nodes.find((n) => n.category === 'client_ui') || nodes[0];
    const authNode = nodes.find((n) => n.category === 'baas_auth');
    const dbNode = nodes.find((n) => n.category === 'baas_database');

    // Left Box: Client Tier
    const clientX = 40;
    const clientY = 110;
    const clientW = 340;
    const clientH = 280;
    const clientStyle = getNodeStyle('client_ui');

    const topComponents = analysis.modules.slice(0, 4).map((m) => m.name);

    svg += `
  <!-- Client UI Tier -->
  <g transform="translate(${clientX}, ${clientY})">
    <rect width="${clientW}" height="${clientH}" rx="10" fill="${clientStyle.fill}" stroke="${clientStyle.stroke}" stroke-width="1.6" />
    <rect width="${clientW}" height="4" rx="2" fill="${clientStyle.badge}" />
    <text x="18" y="32" font-family="Segoe UI, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">${escapeXml(clientNode.label)}</text>
    <rect x="18" y="44" width="160" height="20" rx="4" fill="#312E81" />
    <text x="24" y="58" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="600" fill="#C7D2FE">${escapeXml(clientNode.tech)}</text>
    <text x="18" y="84" font-family="Segoe UI, sans-serif" font-size="11" fill="#94A3B8">${escapeXml(clientNode.sublabel)}</text>
    <line x1="18" y1="96" x2="${clientW - 18}" y2="96" stroke="#4338CA" stroke-width="1" stroke-dasharray="2,2" />
    <text x="18" y="116" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" fill="#A5B4FC">INSPECTED MODULES:</text>
`;
    topComponents.forEach((comp, idx) => {
      svg += `
    <rect x="18" y="${130 + idx * 32}" width="${clientW - 36}" height="24" rx="4" fill="#1E1B4B" stroke="#4338CA" stroke-width="0.8" />
    <circle cx="28" cy="${142 + idx * 32}" r="3" fill="#818CF8" />
    <text x="38" y="${146 + idx * 32}" font-family="Segoe UI, sans-serif" font-size="10.5" fill="#E0E7FF">${escapeXml(truncateText(comp, 26))}</text>
`;
    });
    svg += `  </g>\n`;

    // Right Column: BaaS Cloud Services
    const serviceX = 560;
    const serviceW = 360;

    // Node A: Firebase Auth (Top Right)
    if (authNode) {
      const authY = 110;
      const authH = 130;
      const authStyle = getNodeStyle('baas_auth');
      svg += `
  <!-- Firebase Auth Node -->
  <g transform="translate(${serviceX}, ${authY})">
    <rect width="${serviceW}" height="${authH}" rx="10" fill="${authStyle.fill}" stroke="${authStyle.stroke}" stroke-width="1.6" />
    <rect width="${serviceW}" height="4" rx="2" fill="${authStyle.badge}" />
    <text x="18" y="30" font-family="Segoe UI, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">${escapeXml(authNode.label)}</text>
    <rect x="18" y="42" width="170" height="20" rx="4" fill="#581C87" />
    <text x="24" y="56" font-family="Segoe UI, sans-serif" font-size="10" font-weight="600" fill="#E9D5FF">${escapeXml(authNode.tech)}</text>
    <text x="18" y="80" font-family="Segoe UI, sans-serif" font-size="10.5" fill="#D8B4FE">User Identity, JWT Tokens &amp; Protected State</text>
    <text x="18" y="104" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#C084FC">• Methods: signInWithEmailAndPassword, onAuthStateChanged</text>
  </g>

  <!-- Edge: Client -> Auth -->
  <line x1="${clientX + clientW}" y1="${clientY + 50}" x2="${serviceX - 8}" y2="${authY + 50}" stroke="#C084FC" stroke-width="2.2" marker-end="url(#arrow-purple)" stroke-dasharray="3,2" />
  <text x="${(clientX + clientW + serviceX) / 2}" y="${clientY + 42}" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#C084FC" font-weight="700" text-anchor="middle">Auth SDK Calls</text>
`;
    }

    // Node B: Cloud Firestore (Bottom Right)
    if (dbNode) {
      const dbY = 260;
      const dbH = 130;
      const dbStyle = getNodeStyle('baas_database');
      const colls = analysis.database.detectedCollectionsOrTables.slice(0, 4).map((c) => c.name);
      svg += `
  <!-- Cloud Firestore Node -->
  <g transform="translate(${serviceX}, ${dbY})">
    <rect width="${serviceW}" height="${dbH}" rx="10" fill="${dbStyle.fill}" stroke="${dbStyle.stroke}" stroke-width="1.6" />
    <rect width="${serviceW}" height="4" rx="2" fill="${dbStyle.badge}" />
    <text x="18" y="30" font-family="Segoe UI, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">${escapeXml(dbNode.label)}</text>
    <rect x="18" y="42" width="190" height="20" rx="4" fill="#064E3B" />
    <text x="24" y="56" font-family="Segoe UI, sans-serif" font-size="10" font-weight="600" fill="#A7F3D0">${escapeXml(dbNode.tech)}</text>
    <text x="18" y="80" font-family="Segoe UI, sans-serif" font-size="10.5" fill="#6EE7B7">Managed Document Collections &amp; Rules</text>
    <text x="18" y="104" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#34D399">• Collections: ${escapeXml(colls.join(', ') || 'attendance, users, members')}</text>
  </g>

  <!-- Edge: Client -> Firestore -->
  <line x1="${clientX + clientW}" y1="${clientY + 190}" x2="${serviceX - 8}" y2="${dbY + 60}" stroke="#34D399" stroke-width="2.2" marker-end="url(#arrow-emerald)" stroke-dasharray="3,2" />
  <text x="${(clientX + clientW + serviceX) / 2}" y="${clientY + 180}" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#34D399" font-weight="700" text-anchor="middle">Firestore SDK (Queries/Writes)</text>
`;
    }
  } else if (architectureType === 'client_server_db') {
    // Multi-tier Layout: Client -> Server -> Database
    const nodeCount = nodes.length;
    const cardW = 205;
    const cardH = 260;
    const startX = 35;
    const gapX = (width - 2 * startX - nodeCount * cardW) / Math.max(1, nodeCount - 1);
    const cardY = 120;

    nodes.forEach((node, idx) => {
      const x = startX + idx * (cardW + gapX);
      const style = getNodeStyle(node.category);
      svg += `
  <!-- Node ${idx + 1}: ${node.label} -->
  <g transform="translate(${x}, ${cardY})">
    <rect width="${cardW}" height="${cardH}" rx="10" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.6" />
    <rect width="${cardW}" height="4" rx="2" fill="${style.badge}" />
    <text x="14" y="30" font-family="Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">${escapeXml(truncateText(node.label, 20))}</text>
    <rect x="14" y="42" width="${cardW - 28}" height="20" rx="4" fill="#0F172A" />
    <text x="20" y="56" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="600" fill="${style.stroke}">${escapeXml(truncateText(node.tech, 22))}</text>
    <text x="14" y="80" font-family="Segoe UI, sans-serif" font-size="10" fill="#94A3B8">${escapeXml(node.sublabel)}</text>
    <line x1="14" y1="92" x2="${cardW - 14}" y2="92" stroke="#334155" stroke-width="1" stroke-dasharray="2,2" />
    <text x="14" y="112" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" fill="#CBD5E1">EVIDENCE SOURCE:</text>
    <text x="14" y="132" font-family="Segoe UI, sans-serif" font-size="9" fill="#94A3B8">${escapeXml(truncateText(node.evidenceSources[0] || 'Inspected repository source', 25))}</text>
  </g>
`;
      if (idx < nodeCount - 1) {
        const arrowStart = x + cardW + 4;
        const arrowEnd = arrowStart + gapX - 8;
        const arrowY = cardY + cardH / 2;
        svg += `
  <line x1="${arrowStart}" y1="${arrowY}" x2="${arrowEnd}" y2="${arrowY}" stroke="#38BDF8" stroke-width="2.2" marker-end="url(#arrow)" stroke-dasharray="3,2" />
  <text x="${(arrowStart + arrowEnd) / 2}" y="${arrowY - 8}" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#38BDF8" font-weight="700" text-anchor="middle">HTTP/JSON</text>
`;
      }
    });
  } else {
    // Frontend-only SPA layout
    const cardX = 260;
    const cardY = 120;
    const cardW = 440;
    const cardH = 260;
    const style = colors.client;

    svg += `
  <!-- Frontend Only Node -->
  <g transform="translate(${cardX}, ${cardY})">
    <rect width="${cardW}" height="${cardH}" rx="12" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.8" />
    <rect width="${cardW}" height="5" rx="2" fill="${style.badge}" />
    <text x="24" y="36" font-family="Segoe UI, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">${escapeXml(projectName)} — Single Page Application</text>
    <text x="24" y="60" font-family="Segoe UI, sans-serif" font-size="11.5" fill="#A5B4FC">Architecture: Standalone Client-Side Application</text>
    <line x1="24" y1="74" x2="${cardW - 24}" y2="74" stroke="#4338CA" stroke-width="1" stroke-dasharray="2,2" />
    <text x="24" y="98" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700" fill="#E0E7FF">DISCOVERED INTERFACES &amp; STATE:</text>
    <text x="24" y="122" font-family="Segoe UI, sans-serif" font-size="10" fill="#C7D2FE">• Client Rendering: React Component Tree &amp; State Hooks</text>
    <text x="24" y="146" font-family="Segoe UI, sans-serif" font-size="10" fill="#C7D2FE">• Client Router: In-browser SPA routing without custom server</text>
    <text x="24" y="170" font-family="Segoe UI, sans-serif" font-size="10" fill="#C7D2FE">• Static Assets: Bundled and delivered directly via web server</text>
    <rect x="24" y="196" width="${cardW - 48}" height="32" rx="6" fill="#312E81" />
    <text x="36" y="216" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#E0E7FF">Static verification: No server processes or persistent database drivers detected.</text>
  </g>
`;
  }

  // Footer Legend
  svg += `
  <!-- Footer Metadata & Legend -->
  <rect x="36" y="420" width="${width - 72}" height="38" rx="8" fill="#131D33" stroke="#1E293B" />
  <circle cx="56" cy="439" r="4.5" fill="#818CF8" />
  <text x="68" y="443" font-family="Segoe UI, sans-serif" font-size="10" fill="#CBD5E1">Client UI</text>
  <circle cx="160" cy="439" r="4.5" fill="#C084FC" />
  <text x="172" y="443" font-family="Segoe UI, sans-serif" font-size="10" fill="#CBD5E1">Auth Service</text>
  <circle cx="270" cy="439" r="4.5" fill="#34D399" />
  <text x="282" y="443" font-family="Segoe UI, sans-serif" font-size="10" fill="#CBD5E1">Cloud Firestore</text>
  <circle cx="390" cy="439" r="4.5" fill="#38BDF8" />
  <text x="402" y="443" font-family="Segoe UI, sans-serif" font-size="10" fill="#CBD5E1">Server API</text>
  <text x="${width - 48}" y="443" font-family="Segoe UI, sans-serif" font-size="9.5" fill="#64748B" text-anchor="end">Evidence-based architecture synthesis by ExaPro</text>
</svg>
`;

  // Render to crisp PNG buffer via Resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const description = architectureSummary;

  return {
    svg,
    pngBuffer,
    description,
  };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}
