const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EXPORTS_DIR = path.join(ROOT, "MOGRTS");
const ASSETS_DIR = path.join(ROOT, "Assets");
const PRESETS_DIR = path.join(ROOT, "Presets");
const DOCS_DIR = path.join(ROOT, "Documentation");

const TEMPLATE_ROOT =
  "/Users/creative/Library/Application Support/Adobe/Common/Motion Graphics Templates";

const BRAND = {
  orange: "#CF6F1A",
  warmWhite: "#F6F0E8",
  charcoal: "#181512",
  transparent: [0, 0, 0, 0],
};

const TEMPLATES = [
  {
    outputFile: "HI_BodyGlow_Sweep.mogrt",
    capsuleName: "HI BodyGlow Sweep",
    description:
      "Soft amber body-area glow sweep for Himalayan Institute yoga reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_1787359601.mogrt"),
    uiNames: ["Cue Text"],
    textDefaults: ["Lengthen spine"],
    definitionTextFonts: [{ fontName: "Gotham-Medium", fontSize: 20 }],
    controlOverrides: [
      { name: "Number Of Blocks", value: 1 },
      { name: "On / Off", occurrence: 1, value: false },
      { name: "On / Off", occurrence: 2, value: true },
      { name: "Intensity", value: 48 },
      { name: "Shape Color", value: hexToRgba(BRAND.charcoal, 0.18), all: true },
      { name: "Line Color", value: hexToRgba(BRAND.orange, 1), all: true },
      { name: "Glow Color", value: hexToRgba(BRAND.orange, 1), all: true },
      { name: "Color", value: hexToRgba(BRAND.warmWhite, 1), all: true },
      { name: "Roundness", value: 28 },
      { name: "Size", value: { x: 250, y: 88 } },
      { name: "Position", occurrence: 1, value: { x: 960, y: 540 } },
    ],
  },
  {
    outputFile: "HI_Glow_Point_Node.mogrt",
    capsuleName: "HI Glow Point Node",
    description:
      "Amber glow point node for hands, hips, shoulders, heels, and other body areas.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_414967428.mogrt"),
    uiNames: ["Hidden Text"],
    textDefaults: [" "],
    definitionTextFonts: [{ fontName: "Gotham-Medium", fontSize: 12 }],
    controlOverrides: [
      { name: "Highlight Color", value: hexToRgba(BRAND.orange, 1) },
      { name: "Highlight Line Thickness", value: 24 },
      { name: "Highlight Length", value: 16 },
      { name: "Highlight Opacity", value: 0 },
      { name: "Circle Color", value: hexToRgba(BRAND.orange, 1) },
      { name: "Circle Size", value: [18, 18, 18, 0] },
      { name: "Circle Position", value: { x: 960, y: 540 } },
      { name: "Circle Opacity", value: 100 },
      { name: "Arrow Opacity", value: 0 },
      { name: "Paper Opacity", value: 0 },
      { name: "Background Opacity", value: 0 },
      { name: "X Opacity", value: 0 },
    ],
  },
  {
    outputFile: "HI_Callout_Line.mogrt",
    capsuleName: "HI Callout Line",
    description:
      "Thin connector line with target point for premium yoga anatomy callouts.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_1482393743.mogrt"),
    uiNames: ["Hidden Text"],
    textDefaults: [" "],
    definitionTextFonts: [{ fontName: "Gotham-Medium", fontSize: 16 }],
    controlOverrides: [
      { name: "Text Color 01", value: hexToRgba(BRAND.warmWhite, 1) },
      { name: "Line Color 01", value: hexToRgba(BRAND.orange, 1) },
      { name: "Point Target Color 01", value: hexToRgba(BRAND.orange, 1) },
      { name: "Global Position", value: { x: 1080, y: 1920 } },
      { name: "Global Size", value: [100, 100, 100] },
      { name: "Start X", value: 820 },
      { name: "Start Y", value: 1180 },
      { name: "End X ", value: 1240 },
      { name: "End Y ", value: 820 },
    ],
  },
  {
    outputFile: "HI_Caption_Callout.mogrt",
    capsuleName: "HI Caption Callout",
    description:
      "Minimal premium yoga caption callout positioned above reel captions.",
    base: path.join(
      TEMPLATE_ROOT,
      "Lower Thirds/Classic Lower Third Two Lines.mogrt"
    ),
    uiNames: ["Body Area", "Cue Text"],
    textDefaults: ["SHOULDERS", "Soften away from the ears"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 32,
        alignment: 0,
        tracking: 110,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 44,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 20,
        shadowOpacity: 36,
      },
    ],
    definitionTextFonts: [
      { fontName: "Gotham-Medium", fontSize: 32 },
      { fontName: "Gotham-Medium", fontSize: 44 },
    ],
  },
  {
    outputFile: "HI_Breath_Pulse.mogrt",
    capsuleName: "HI Breath Pulse",
    description:
      "Soft circular breath cue for inhale and exhale moments in yoga reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_414967428.mogrt"),
    uiNames: ["Breath Cue"],
    textDefaults: ["Exhale"],
    definitionTextFonts: [{ fontName: "Gotham-Medium", fontSize: 28 }],
    controlOverrides: [
      { name: "Highlight Opacity", value: 0 },
      { name: "Circle Color", value: hexToRgba(BRAND.orange, 1) },
      { name: "Circle Line Thickness", value: 22 },
      { name: "Circle Size", value: [74, 74, 74, 0] },
      { name: "Circle Position", value: { x: 520, y: 960 } },
      { name: "Circle Opacity", value: 88 },
      { name: "Arrow Opacity", value: 0 },
      { name: "Paper Opacity", value: 0 },
      { name: "Background Opacity", value: 0 },
      { name: "X Opacity", value: 0 },
    ],
  },
  {
    outputFile: "HI_Save_CTA.mogrt",
    capsuleName: "HI Save CTA",
    description:
      "Closing save CTA for Himalayan Institute vertical reels.",
    base: path.join(TEMPLATE_ROOT, "Titles/Modern Title.mogrt"),
    uiNames: ["CTA Text", "CTA Accent"],
    textDefaults: ["Save this for your next practice", "HIMALAYAN INSTITUTE"],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 98,
        alignment: 2,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 34,
        shadowOpacity: 42,
      },
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 30,
        alignment: 2,
        tracking: 100,
        shadowVisible: false,
      },
    ],
    definitionTextFonts: [
      { fontName: "Gotham-Medium", fontSize: 98 },
      { fontName: "Gotham-Medium", fontSize: 30 },
    ],
  },
  {
    outputFile: "HI_Full_Cue_Combo.mogrt",
    capsuleName: "HI Full Cue Combo",
    description:
      "Fast all-in-one cue with point, connector line, and yoga caption.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_1482393743.mogrt"),
    uiNames: ["Cue Text"],
    textDefaults: ["Root through palms"],
    definitionTextFonts: [{ fontName: "Gotham-Medium", fontSize: 74 }],
    controlOverrides: [
      { name: "Text Color 01", value: hexToRgba(BRAND.warmWhite, 1) },
      { name: "Line Color 01", value: hexToRgba(BRAND.orange, 1) },
      { name: "Point Target Color 01", value: hexToRgba(BRAND.orange, 1) },
      { name: "Global Position", value: { x: 1080, y: 1920 } },
      { name: "Global Size", value: [100, 100, 100] },
      { name: "Start X", value: 790 },
      { name: "Start Y", value: 1240 },
      { name: "End X ", value: 1330 },
      { name: "End Y ", value: 860 },
    ],
  },
];

function run(command, args, options = {}) {
  return cp.execFileSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
    alpha,
  ];
}

function rgbInt(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

function localizedString(value) {
  return { strDB: [{ localeString: "en_US", str: value }] };
}

function setLocalizedField(field, value) {
  if (!field || !Array.isArray(field.strDB)) {
    return localizedString(value);
  }
  field.strDB = field.strDB.map((entry) => ({ ...entry, str: value }));
  if (!field.strDB.find((entry) => entry.localeString === "en_US")) {
    field.strDB.unshift({ localeString: "en_US", str: value });
  }
  return field;
}

function formatHash(buffer) {
  const hash = crypto.createHash("md5").update(buffer).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(
    12,
    16
  )}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

function decodePayload(base64) {
  const buffer = Buffer.from(base64, "base64");
  return buffer.subarray(8).toString("utf16le").replace(/\0+$/, "");
}

function encodePayload(payloadString) {
  const body = Buffer.from(`${payloadString}\0`, "utf16le");
  const header = Buffer.alloc(8);
  header.writeUInt32LE(body.length + header.length, 0);
  header.writeUInt32LE(0, 4);
  const combined = Buffer.concat([header, body]);
  return {
    base64: combined.toString("base64"),
    hash: formatHash(combined),
  };
}

function replaceOnce(source, pattern, replacement) {
  return pattern.test(source) ? source.replace(pattern, replacement) : source;
}

function updateTextPayload(payloadString, text, style) {
  let updated = payloadString;
  updated = replaceOnce(updated, /"mText":"[^"]*"/, `"mText":${JSON.stringify(text)}`);

  if (style.alignment !== undefined) {
    updated = replaceOnce(updated, /"mAlignment":[0-9]+/, `"mAlignment":${style.alignment}`);
  }
  if (style.shadowVisible !== undefined) {
    updated = replaceOnce(
      updated,
      /"mShadowVisible":(?:true|false)/,
      `"mShadowVisible":${style.shadowVisible}`
    );
  }
  if (style.shadowBlur !== undefined) {
    updated = replaceOnce(updated, /"mShadowBlur":[0-9.+-]+/, `"mShadowBlur":${style.shadowBlur}`);
  }
  if (style.shadowOpacity !== undefined) {
    updated = replaceOnce(
      updated,
      /"mShadowOpacity":[0-9.+-]+/,
      `"mShadowOpacity":${style.shadowOpacity}`
    );
  }
  if (style.fontName) {
    updated = replaceOnce(
      updated,
      /"mFontName":\{"mParamValues":\[\[0,"[^"]*"\]\]\}/,
      `"mFontName":{"mParamValues":[[0,${JSON.stringify(style.fontName)}]]}`
    );
  }
  if (style.fontSize !== undefined) {
    updated = replaceOnce(
      updated,
      /"mFontSize":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mFontSize":{"mParamValues":[[0,${style.fontSize}]]}`
    );
  }
  if (style.fillColor) {
    updated = replaceOnce(
      updated,
      /"mFillColor":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mFillColor":{"mParamValues":[[0,${rgbInt(style.fillColor)}]]}`
    );
  }
  if (style.strokeColor) {
    updated = replaceOnce(
      updated,
      /"mStrokeColor":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mStrokeColor":{"mParamValues":[[0,${rgbInt(style.strokeColor)}]]}`
    );
  }
  if (style.strokeVisible !== undefined) {
    updated = replaceOnce(
      updated,
      /"mStrokeVisible":\{"mParamValues":\[\[0,(?:true|false)\]\]\}/,
      `"mStrokeVisible":{"mParamValues":[[0,${style.strokeVisible}]]}`
    );
  }
  if (style.tracking !== undefined) {
    updated = replaceOnce(
      updated,
      /"mTracking":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mTracking":{"mParamValues":[[0,${style.tracking}]]}`
    );
  }
  return updated;
}

function patchXml(xml, template) {
  if (!template.textDefaults || !template.textDefaults.length) return xml;
  let index = 0;
  return xml.replace(
    /<StartKeyframeValue Encoding="base64" BinaryHash="([^"]+)">([^<]+)<\/StartKeyframeValue>/g,
    (full, oldHash, base64) => {
      let payload;
      try {
        payload = decodePayload(base64);
      } catch {
        return full;
      }
      const hasTextPayload =
        typeof payload === "string" &&
        payload.includes('"mTextParam"') &&
        payload.includes('"mText":');
      if (!hasTextPayload || index >= template.textDefaults.length) {
        return full;
      }
      const updated = updateTextPayload(
        payload,
        template.textDefaults[index],
        (template.textStyles || [])[index] || {}
      );
      const encoded = encodePayload(updated);
      index += 1;
      return `<StartKeyframeValue Encoding="base64" BinaryHash="${encoded.hash}">${encoded.base64}</StartKeyframeValue>`;
    }
  );
}

function setControlValue(definition, override) {
  const controls = definition.clientControls || [];
  const matches = controls.filter((control) => {
    const current =
      (control.uiName?.strDB || []).find((entry) => entry.localeString === "en_US")
        ?.str || "";
    return current === override.name;
  });
  if (!matches.length) return;
  const targets = override.all
    ? matches
    : [matches[(override.occurrence || 1) - 1]].filter(Boolean);
  targets.forEach((control) => {
    control.value = override.value;
  });
}

function patchDefinition(definition, template) {
  definition.capsuleID = crypto.randomUUID();
  definition.capsuleName = template.capsuleName;
  definition.description = template.description;
  definition.capsuleNameLocalized = setLocalizedField(
    definition.capsuleNameLocalized,
    template.capsuleName
  );

  const textControls = (definition.clientControls || []).filter(
    (control) => control.type === 6
  );
  textControls.forEach((control, index) => {
    if (template.uiNames && template.uiNames[index]) {
      control.uiName = localizedString(template.uiNames[index]);
    }
    if (template.textDefaults && template.textDefaults[index] !== undefined) {
      control.value = localizedString(template.textDefaults[index]);
    }
    const fontOverride = (template.definitionTextFonts || [])[index];
    if (fontOverride) {
      control.fonteditinfo = control.fonteditinfo || {};
      if (fontOverride.fontName) {
        control.fonteditinfo.fontEditValue = fontOverride.fontName;
      }
      if (fontOverride.fontSize !== undefined) {
        control.fonteditinfo.fontSizeEditValue = fontOverride.fontSize;
      }
    }
  });

  (template.controlOverrides || []).forEach((override) =>
    setControlValue(definition, override)
  );

  Object.values(definition.sourceInfoLocalized || {}).forEach((info) => {
    if (info.framesize?.size) {
      info.framesize.size.x = 1080;
      info.framesize.size.y = 1920;
    }
    if (info.pixelaspectratio) {
      info.pixelaspectratio = { numerator: 1, denominator: 1 };
    }
  });

  return definition;
}

function unzipToDir(zipFile, destDir) {
  ensureDir(destDir);
  run("unzip", ["-qq", zipFile, "-d", destDir]);
}

function zipDir(sourceDir, outputFile) {
  const previous = process.cwd();
  process.chdir(sourceDir);
  try {
    run("zip", ["-qr", outputFile, "."]);
  } finally {
    process.chdir(previous);
  }
}

function findFile(directory, suffix) {
  return fs
    .readdirSync(directory)
    .find((entry) => entry.toLowerCase().endsWith(suffix.toLowerCase()));
}

function buildTemplate(template) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hi-body-mogrt-"));
  const mogrtDir = path.join(tmpRoot, "mogrt");
  const prgraphicDir = path.join(tmpRoot, "prgraphic");
  ensureDir(mogrtDir);
  ensureDir(prgraphicDir);

  unzipToDir(template.base, mogrtDir);

  const definitionPath = path.join(mogrtDir, "definition.json");
  const definition = JSON.parse(fs.readFileSync(definitionPath, "utf8"));
  fs.writeFileSync(
    definitionPath,
    JSON.stringify(patchDefinition(definition, template))
  );

  const graphicArchiveName =
    findFile(mogrtDir, ".prgraphic") || findFile(mogrtDir, ".aegraphic");

  if (graphicArchiveName && graphicArchiveName.toLowerCase().endsWith(".prgraphic")) {
    const prgraphicPath = path.join(mogrtDir, graphicArchiveName);
    unzipToDir(prgraphicPath, prgraphicDir);
    const prprojName = findFile(prgraphicDir, ".prproj");
    if (prprojName) {
      const prprojPath = path.join(prgraphicDir, prprojName);
      try {
        const rawPrproj = fs.readFileSync(prprojPath);
        const xml = zlib.gunzipSync(rawPrproj).toString("utf8");
        const patchedXml = patchXml(xml, template)
          .replaceAll("1920,1080", "1080,1920")
          .replaceAll("1280x720", "1080x1920")
          .replaceAll("1920x1080", "1080x1920");
        fs.writeFileSync(prprojPath, zlib.gzipSync(Buffer.from(patchedXml, "utf8")));
      } catch {
        // Ignore nested patching failures and still preserve the original archive.
      }
    }
    fs.unlinkSync(prgraphicPath);
    zipDir(prgraphicDir, prgraphicPath);
  }

  const outputPath = path.join(EXPORTS_DIR, template.outputFile);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  zipDir(mogrtDir, outputPath);

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  return {
    file: template.outputFile,
    capsuleName: template.capsuleName,
    base: template.base,
  };
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function main() {
  ensureDir(EXPORTS_DIR);
  ensureDir(ASSETS_DIR);
  ensureDir(PRESETS_DIR);
  ensureDir(DOCS_DIR);
  const results = TEMPLATES.map(buildTemplate);
  writeJson(path.join(DOCS_DIR, "mogrt_manifest.json"), results);
  console.log(`Built ${results.length} MOGRT files in ${EXPORTS_DIR}`);
  results.forEach((entry) => console.log(`- ${entry.file}`));
}

main();
