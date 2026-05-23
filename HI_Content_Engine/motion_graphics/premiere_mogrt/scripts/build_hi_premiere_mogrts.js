const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EXPORTS_DIR = path.join(ROOT, "exports");
const DOCS_DIR = path.join(ROOT, "docs");

const BRAND = {
  orange: "#CF6F1A",
  warmWhite: "#F6F0E8",
};

const TEMPLATE_ROOT =
  "/Users/creative/Library/Application Support/Adobe/Common/Motion Graphics Templates";

const TEMPLATES = [
  {
    outputFile: "HI__HOOK_TITLE__CENTER.mogrt",
    capsuleName: "HI Hook Title Center",
    description:
      "Centered hook title for Himalayan Institute vertical Instagram Reels.",
    base: path.join(TEMPLATE_ROOT, "Titles/Modern Title.mogrt"),
    uiNames: ["Hook Title", "Accent Label"],
    textDefaults: [
      "A steadier breath changes everything",
      "HIMALAYAN INSTITUTE",
    ],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 118,
        alignment: 2,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 40,
        shadowOpacity: 45,
      },
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 36,
        alignment: 2,
        tracking: 120,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__QUOTE_OVERLAY__CENTER.mogrt",
    capsuleName: "HI Quote Overlay Center",
    description:
      "Centered quote overlay for lecture and wisdom clips in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "Basic Title.mogrt"),
    uiNames: ["Quote Text"],
    textDefaults: [
      "Peace begins when the body no longer argues with the breath.",
    ],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Book",
        fontSize: 86,
        alignment: 2,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 36,
        shadowOpacity: 55,
      },
    ],
  },
  {
    outputFile: "HI__QUOTE_OVERLAY__LOWER_THIRD.mogrt",
    capsuleName: "HI Quote Overlay Lower Third",
    description:
      "Lower-third quote overlay with source/accent line for lecture footage.",
    base: path.join(
      TEMPLATE_ROOT,
      "Lower Thirds/Classic Lower Third Two Lines.mogrt"
    ),
    uiNames: ["Quote Text", "Accent Label"],
    textDefaults: [
      "Let the breath arrive before the thought.",
      "HIMALAYAN INSTITUTE",
    ],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 52,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 28,
        shadowOpacity: 45,
      },
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 30,
        alignment: 0,
        tracking: 80,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__KEY_POINT__01.mogrt",
    capsuleName: "HI Key Point 01",
    description:
      "First numbered key-point card for teaching takeaways in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_357915680.mogrt"),
    uiNames: ["Point Number", "Point Headline", "Point Detail"],
    textDefaults: ["1", "Ground the feet", "before you lengthen the spine"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 92,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 48,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 24,
        shadowOpacity: 38,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Book",
        fontSize: 36,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__KEY_POINT__02.mogrt",
    capsuleName: "HI Key Point 02",
    description:
      "Second numbered key-point card for teaching takeaways in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_357915680.mogrt"),
    uiNames: ["Point Number", "Point Headline", "Point Detail"],
    textDefaults: ["2", "Lift through the heart", "without hardening the jaw"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 92,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 48,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 24,
        shadowOpacity: 38,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Book",
        fontSize: 36,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__KEY_POINT__03.mogrt",
    capsuleName: "HI Key Point 03",
    description:
      "Third numbered key-point card for teaching takeaways in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_357915680.mogrt"),
    uiNames: ["Point Number", "Point Headline", "Point Detail"],
    textDefaults: ["3", "Let the exhale finish", "before beginning the next move"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 92,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 48,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 24,
        shadowOpacity: 38,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Book",
        fontSize: 36,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__SPEAKER_LOWER_THIRD.mogrt",
    capsuleName: "HI Speaker Lower Third",
    description:
      "Speaker ID lower third for Himalayan Institute teachers in reels.",
    base: path.join(
      TEMPLATE_ROOT,
      "Lower Thirds/Classic Lower Third Two Lines.mogrt"
    ),
    uiNames: ["Teacher Name", "Teacher Title"],
    textDefaults: ["Sandy Anderson", "Himalayan Institute"],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 50,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 22,
        shadowOpacity: 35,
      },
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 28,
        alignment: 0,
        tracking: 100,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__BODY_HIGHLIGHT__CALLOUT.mogrt",
    capsuleName: "HI Body Highlight Callout",
    description:
      "Reusable body-part yoga highlight callout for alignment cues in vertical reels.",
    base: path.join(
      TEMPLATE_ROOT,
      "Lower Thirds/Classic Lower Third Two Lines.mogrt"
    ),
    uiNames: ["Body Part", "Cue Text"],
    textDefaults: ["SHOULDERS", "Soften the shoulders away from the ears"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 34,
        alignment: 0,
        tracking: 120,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 46,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 22,
        shadowOpacity: 38,
      },
    ],
  },
  {
    outputFile: "HI__BODY_HIGHLIGHT__NUMBERED.mogrt",
    capsuleName: "HI Body Highlight Numbered",
    description:
      "Numbered body-part highlight for a single alignment reminder in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "AdobeStock_357915680.mogrt"),
    uiNames: ["Body Number", "Body Part", "Alignment Cue"],
    textDefaults: ["1", "HIPS", "Draw the hips back before lengthening forward"],
    textStyles: [
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 88,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 46,
        alignment: 0,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 22,
        shadowOpacity: 36,
      },
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Book",
        fontSize: 34,
        alignment: 0,
        tracking: 0,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__BODY_HIGHLIGHT__CENTER_TAG.mogrt",
    capsuleName: "HI Body Highlight Center Tag",
    description:
      "Centered body-part tag for short yoga anatomy highlights in vertical reels.",
    base: path.join(TEMPLATE_ROOT, "Titles/Modern Title.mogrt"),
    uiNames: ["Body Part", "Cue Accent"],
    textDefaults: ["SPINE", "Lift through the crown"],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 104,
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
        tracking: 90,
        shadowVisible: false,
      },
    ],
  },
  {
    outputFile: "HI__CLOSING_CTA__CENTER.mogrt",
    capsuleName: "HI Closing CTA Center",
    description:
      "Centered closing call to action for Himalayan Institute reels.",
    base: path.join(TEMPLATE_ROOT, "Titles/Modern Title.mogrt"),
    uiNames: ["CTA Text", "CTA Accent"],
    textDefaults: ["Save this practice", "himalayaninstitute.org"],
    textStyles: [
      {
        fillColor: BRAND.warmWhite,
        fontName: "Gotham-Medium",
        fontSize: 108,
        alignment: 2,
        tracking: 0,
        shadowVisible: true,
        shadowBlur: 36,
        shadowOpacity: 40,
      },
      {
        fillColor: BRAND.orange,
        fontName: "Gotham-Medium",
        fontSize: 32,
        alignment: 2,
        tracking: 80,
        shadowVisible: false,
      },
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
  let found = false;
  field.strDB = field.strDB.map((entry) => {
    if (entry.localeString === "en_US") {
      found = true;
      return { ...entry, str: value };
    }
    return { ...entry, str: value };
  });
  if (!found) {
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
  if (style.shadowOffset !== undefined) {
    updated = replaceOnce(
      updated,
      /"mShadowOffset":[0-9.+-]+/,
      `"mShadowOffset":${style.shadowOffset}`
    );
  }
  if (style.shadowAngle !== undefined) {
    updated = replaceOnce(
      updated,
      /"mShadowAngle":[0-9.+-]+/,
      `"mShadowAngle":${style.shadowAngle}`
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
  if (style.strokeWidth !== undefined) {
    updated = replaceOnce(
      updated,
      /"mStrokeWidth":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mStrokeWidth":{"mParamValues":[[0,${style.strokeWidth}]]}`
    );
  }
  if (style.fillVisible !== undefined) {
    updated = replaceOnce(
      updated,
      /"mFillVisible":\{"mParamValues":\[\[0,(?:true|false)\]\]\}/,
      `"mFillVisible":{"mParamValues":[[0,${style.fillVisible}]]}`
    );
  }
  if (style.tracking !== undefined) {
    updated = replaceOnce(
      updated,
      /"mTracking":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mTracking":{"mParamValues":[[0,${style.tracking}]]}`
    );
  }
  if (style.kerning !== undefined) {
    updated = replaceOnce(
      updated,
      /"mKerning":\{"mParamValues":\[\[0,[0-9.+-]+\]\]\}/,
      `"mKerning":{"mParamValues":[[0,${style.kerning}]]}`
    );
  }

  return updated;
}

function patchXml(xml, textDefaults, textStyles) {
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

      if (!hasTextPayload || index >= textDefaults.length) {
        return full;
      }

      const updated = updateTextPayload(
        payload,
        textDefaults[index],
        textStyles[index] || {}
      );
      const encoded = encodePayload(updated);
      index += 1;
      return `<StartKeyframeValue Encoding="base64" BinaryHash="${encoded.hash}">${encoded.base64}</StartKeyframeValue>`;
    }
  );
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
    control.uiName = localizedString(template.uiNames[index] || `Text ${index + 1}`);
    control.value = localizedString(template.textDefaults[index] || "");
  });

  const allFonts = new Set();
  template.textStyles.forEach((style) => {
    if (style.fontName) allFonts.add(style.fontName);
  });
  definition.usedFontsLocalized = definition.usedFontsLocalized || {};
  Object.keys(definition.usedFontsLocalized).forEach((locale) => {
    definition.usedFontsLocalized[locale] = Array.from(allFonts);
  });
  if (!Object.keys(definition.usedFontsLocalized).length) {
    definition.usedFontsLocalized.en_US = Array.from(allFonts);
  }

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
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hi-mogrt-"));
  const mogrtDir = path.join(tmpRoot, "mogrt");
  const prgraphicDir = path.join(tmpRoot, "prgraphic");
  ensureDir(mogrtDir);
  ensureDir(prgraphicDir);

  unzipToDir(template.base, mogrtDir);

  const definitionPath = path.join(mogrtDir, "definition.json");
  const definition = JSON.parse(fs.readFileSync(definitionPath, "utf8"));
  const patchedDefinition = patchDefinition(definition, template);
  fs.writeFileSync(definitionPath, JSON.stringify(patchedDefinition));

  const prgraphicPath = path.join(mogrtDir, "project.prgraphic");
  unzipToDir(prgraphicPath, prgraphicDir);
  const prprojName = findFile(prgraphicDir, ".prproj");
  if (!prprojName) {
    throw new Error(`Could not find inner .prproj for ${template.outputFile}`);
  }

  const prprojPath = path.join(prgraphicDir, prprojName);
  const rawPrproj = fs.readFileSync(prprojPath);
  const xml = zlib.gunzipSync(rawPrproj).toString("utf8");
  const patchedXml = patchXml(xml, template.textDefaults, template.textStyles)
    .replaceAll("1920,1080", "1080,1920")
    .replaceAll("1280x720", "1080x1920")
    .replaceAll("1920x1080", "1080x1920");
  fs.writeFileSync(prprojPath, zlib.gzipSync(Buffer.from(patchedXml, "utf8")));

  fs.unlinkSync(prgraphicPath);
  zipDir(prgraphicDir, prgraphicPath);

  const outputPath = path.join(EXPORTS_DIR, template.outputFile);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  zipDir(mogrtDir, outputPath);

  fs.rmSync(tmpRoot, { recursive: true, force: true });

  return {
    file: template.outputFile,
    capsuleName: template.capsuleName,
    base: path.relative(ROOT, template.base),
  };
}

function writeManifest(entries) {
  const manifestPath = path.join(DOCS_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2));
}

function main() {
  ensureDir(EXPORTS_DIR);
  ensureDir(DOCS_DIR);
  const results = TEMPLATES.map(buildTemplate);
  writeManifest(results);
  console.log(`Built ${results.length} MOGRT files in ${EXPORTS_DIR}`);
  results.forEach((entry) => console.log(`- ${entry.file}`));
}

main();
