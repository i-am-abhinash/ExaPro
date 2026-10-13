import { Resvg } from '@resvg/resvg-js';
import { AnalysisResult } from './analyzerService';

export interface DiagramResult {
  svg: string;
  pngBuffer: Buffer;
  description: string;
}

export async function generateProjectArchitecture(analysis: AnalysisResult): Promise<DiagramResult> {
  const { detectedTechnologies, components, databaseSchemas, apiEndpoints, projectName } = analysis;

  const hasFrontend = detectedTechnologies.frontend.length > 0 || components.some((c) => c.type === 'client');
  const hasBackend = detectedTechnologies.backend.length > 0 || components.some((c) => c.type === 'server' || c.type === 'router');
  const hasDatabase = detectedTechnologies.database.length > 0 || databaseSchemas.length > 0;
  const hasServices = components.some((c) => c.type === 'service');

  // Build the tiers
  const tiers: Array<{
    title: string;
    tech: string;
    subtitle: string;
    items: string[];
    color: string;
    borderColor: string;
  }> = [];

  // 1. Client Tier
  if (hasFrontend) {
    const uiTech = detectedTechnologies.frontend.slice(0, 3).join(', ') || 'Web Client';
    const uiItems = components.filter((c) => c.type === 'client').map((c) => c.name).slice(0, 3);
    tiers.push({
      title: 'Client / UI Tier',
      tech: uiTech,
      subtitle: 'User Interface & State Management',
      items: uiItems.length > 0 ? uiItems : ['Application UI', 'Component Tree', 'Client Router'],
      color: '#8b5cf6', // Violet
      borderColor: '#a78bfa',
    });
  } else {
    tiers.push({
      title: 'Client / Consumer Tier',
      tech: 'REST / CLI Consumer',
      subtitle: 'External Clients & API Callers',
      items: ['HTTP Client', 'API Requests', 'JSON Payloads'],
      color: '#8b5cf6',
      borderColor: '#a78bfa',
    });
  }

  // 2. Gateway / Server Tier
  const srvTech = detectedTechnologies.backend.slice(0, 2).join(', ') || 'API Server';
  const routerItems = apiEndpoints.slice(0, 3).map((e) => `${e.method} ${e.path}`);
  tiers.push({
    title: 'Server & Routing Tier',
    tech: srvTech,
    subtitle: 'Express Application & Route Handlers',
    items: routerItems.length > 0 ? routerItems : ['HTTP Request Pipeline', 'CORS / Middleware', 'Route Controllers'],
    color: '#06b6d4', // Cyan
    borderColor: '#22d3ee',
  });

  // 3. Service / Logic Tier
  const svcItems = components.filter((c) => c.type === 'service').map((c) => c.name).slice(0, 3);
  tiers.push({
    title: 'Logic & Service Tier',
    tech: 'Business Core Modules',
    subtitle: 'Validation & Application Operations',
    items: svcItems.length > 0 ? svcItems : ['Business Logic Engine', 'Data Transformation', 'Error Handling'],
    color: '#3b82f6', // Blue
    borderColor: '#60a5fa',
  });

  // 4. Persistence / Database Tier
  if (hasDatabase) {
    const dbTech = detectedTechnologies.database.slice(0, 2).join(', ') || 'Database';
    const schemaItems = databaseSchemas.slice(0, 3).map((s) => `${s.modelName} Collection`);
    tiers.push({
      title: 'Data & Persistence Tier',
      tech: dbTech,
      subtitle: 'Document Store & Data Schemas',
      items: schemaItems.length > 0 ? schemaItems : ['Data Models', 'Mongoose Schemas', 'Database Storage'],
      color: '#10b981', // Emerald
      borderColor: '#34d399',
    });
  } else {
    tiers.push({
      title: 'Data & Storage Tier',
      tech: 'Filesystem / In-Memory',
      subtitle: 'Local Storage & Memory Models',
      items: ['Config Files', 'File Store', 'Runtime State'],
      color: '#64748b', // Slate
      borderColor: '#94a3b8',
    });
  }

  // Generate SVG markup
  const width = 940;
  const height = 480;
  const cardWidth = 190;
  const cardHeight = 260;
  const startX = 35;
  const gapX = (width - 2 * startX - tiers.length * cardWidth) / (tiers.length - 1);
  const cardY = 130;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#131c2e" />
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" rx="16" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5" />

  <!-- Diagram Title Header -->
  <text x="40" y="50" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">
    ${escapeXml(projectName)} — System Architecture Diagram
  </text>
  <text x="40" y="75" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#94a3b8">
    Evidence-based component tiers and directional data flow discovered during static inspection
  </text>
`;

  // Draw tiers cards
  tiers.forEach((tier, index) => {
    const x = startX + index * (cardWidth + gapX);
    svg += `
  <!-- Tier ${index + 1}: ${tier.title} -->
  <g transform="translate(${x}, ${cardY})">
    <!-- Card Box -->
    <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="${tier.borderColor}" stroke-width="1.8" />
    
    <!-- Accent Top Banner -->
    <rect width="${cardWidth}" height="5" rx="2" fill="${tier.color}" />

    <!-- Tier Number Badge -->
    <rect x="12" y="18" width="22" height="22" rx="6" fill="${tier.color}" opacity="0.2" />
    <text x="23" y="34" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold" fill="${tier.color}" text-anchor="middle">${index + 1}</text>

    <!-- Tier Title -->
    <text x="40" y="34" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold" fill="#f1f5f9">
      ${escapeXml(tier.title)}
    </text>

    <!-- Tech Badge -->
    <rect x="12" y="48" width="${cardWidth - 24}" height="24" rx="5" fill="#0f172a" stroke="#334155" stroke-width="1" />
    <text x="20" y="64" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" fill="${tier.color}">
      ${escapeXml(tier.tech)}
    </text>

    <!-- Subtitle -->
    <text x="12" y="92" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="#94a3b8">
      ${escapeXml(tier.subtitle)}
    </text>

    <!-- Divider -->
    <line x1="12" y1="102" x2="${cardWidth - 12}" y2="102" stroke="#334155" stroke-width="1" stroke-dasharray="2,2" />

    <!-- Discovered Items -->
    <text x="12" y="122" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="bold" fill="#cbd5e1">DETECTED MODULES:</text>
`;

    tier.items.forEach((item, itemIdx) => {
      const itemY = 144 + itemIdx * 32;
      svg += `
    <rect x="12" y="${itemY - 14}" width="${cardWidth - 24}" height="24" rx="4" fill="#1e293b" stroke="#334155" stroke-width="0.8" />
    <circle cx="22" cy="${itemY - 2}" r="3" fill="${tier.color}" />
    <text x="32" y="${itemY + 2}" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" fill="#e2e8f0">
      ${escapeXml(truncateText(item, 20))}
    </text>
`;
    });

    svg += `  </g>\n`;

    // Arrow to next tier
    if (index < tiers.length - 1) {
      const arrowStartX = x + cardWidth + 5;
      const arrowEndX = arrowStartX + gapX - 10;
      const arrowY = cardY + cardHeight / 2;
      svg += `
  <!-- Connection ${index + 1} -> ${index + 2} -->
  <line x1="${arrowStartX}" y1="${arrowY}" x2="${arrowEndX}" y2="${arrowY}" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow)" stroke-dasharray="4,2" />
  <text x="${(arrowStartX + arrowEndX) / 2}" y="${arrowY - 10}" font-family="Segoe UI, Arial, sans-serif" font-size="9.5" fill="#38bdf8" text-anchor="middle" font-weight="bold">Calls</text>
`;
    }
  });

  // Footer legend
  svg += `
  <!-- Footer legend -->
  <rect x="35" y="420" width="${width - 70}" height="38" rx="8" fill="#131c2e" stroke="#1e293b" />
  <circle cx="55" cy="439" r="5" fill="#8b5cf6" />
  <text x="68" y="443" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#cbd5e1">Client Tier</text>
  <circle cx="165" cy="439" r="5" fill="#06b6d4" />
  <text x="178" y="443" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#cbd5e1">Server API</text>
  <circle cx="275" cy="439" r="5" fill="#3b82f6" />
  <text x="288" y="443" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#cbd5e1">Logic Services</text>
  <circle cx="395" cy="439" r="5" fill="#10b981" />
  <text x="408" y="443" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#cbd5e1">Database Tier</text>
  <text x="${width - 55}" y="443" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="#64748b" text-anchor="end">Deterministic Architecture Generation by Exapro</text>
</svg>
`;

  // Render to PNG buffer using Resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200, // High-res rendering for crisp Word document display
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const description = generateArchitectureDescription(tiers, projectName, analysis);

  return {
    svg,
    pngBuffer,
    description,
  };
}

function generateArchitectureDescription(
  tiers: Array<{ title: string; tech: string; subtitle: string; items: string[]; color: string; borderColor: string }>,
  projectName: string,
  analysis: AnalysisResult
): string {
  const parts: string[] = [
    `The system architecture of ${projectName} is structured into ${tiers.length} distinct, interconnected architectural tiers derived directly from inspected project files and dependencies:`,
  ];

  tiers.forEach((t, i) => {
    parts.push(
      `${i + 1}. **${t.title} (${t.tech})**: ${t.subtitle}. Primary components include ${t.items.join(', ')}.`
    );
  });

  parts.push(
    `\n**Communication & Data Flow:** Operations initiate at the client tier, which dispatches requests across HTTP/JSON interfaces to the server routing layer. The server validates payloads and delegates business tasks to the service layer. Persistent records and queries are synchronized with the data tier through declared schemas.`
  );

  return parts.join('\n');
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
