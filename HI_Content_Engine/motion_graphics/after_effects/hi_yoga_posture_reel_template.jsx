/*
  hi_yoga_posture_reel_template.jsx
  Reusable 60-second vertical motion graphics system for Himalayan Institute yoga posture reels.

  What this script builds:
  - Main 1080x1920 reel comp
  - Modular precomps for:
      THOUGHT_BUBBLE__TEMPLATE
      GLOW_HIGHLIGHT__TEMPLATE
      BREATH_CIRCLE__TEMPLATE
      CLOSING_CTA__TEMPLATE
      FULL_BODY_CONNECTION__TEMPLATE
  - Example posture timeline for Downward Dog
  - Editable control nulls for bubble positions and glow targets
  - A face-safe guide so overlays do not cover the practitioner's face

  Usage:
  1. Open Adobe After Effects.
  2. Run this script with File > Scripts > Run Script File...
  3. Open the generated "DOWNWARD_DOG__MASTER" comp.
  4. Replace the placeholder footage layer with your video.
  5. Drag the named *_CTRL null layers to reposition bubble callouts and glow targets.
  6. Edit cue text or timing by updating the REEL_CONFIG block below and re-running the script.
*/

(function buildHiYogaPostureReel() {
    if (!app.project) {
        app.newProject();
    }

    app.beginUndoGroup("Build HI Yoga Posture Reel Template");

    var REEL_CONFIG = {
        width: 1080,
        height: 1920,
        duration: 60,
        fps: 30,
        compName: "DOWNWARD_DOG__MASTER",
        postureName: "Downward Dog",
        faceSafeZone: {
            position: [540, 300],
            size: [360, 340]
        },
        colors: {
            accent: [0.8118, 0.4353, 0.1020],
            cream: [0.9725, 0.9490, 0.9020],
            softCream: [0.9882, 0.9765, 0.9451],
            line: [0.9451, 0.9137, 0.8667],
            transparentAccent: [0.8118, 0.4353, 0.1020, 0.28]
        },
        fontPrimary: "Gotham",
        fontFallback: "ArialMT",
        cueDefaults: {
            holdSeconds: 5,
            bubbleScaleIn: 108,
            bubbleScaleRest: 100
        },
        controlPoints: [
            { name: "GLOW_HANDS_CTRL", position: [285, 1310] },
            { name: "GLOW_ARMS_CTRL", position: [350, 1160] },
            { name: "GLOW_SHOULDERS_CTRL", position: [450, 940] },
            { name: "GLOW_SPINE_CTRL", position: [540, 980] },
            { name: "GLOW_HIPS_CTRL", position: [545, 820] },
            { name: "GLOW_LEGS_CTRL", position: [625, 1210] },
            { name: "GLOW_HEELS_CTRL", position: [730, 1500] },
            { name: "GLOW_NECK_CTRL", position: [540, 720] },
            { name: "FULL_BODY_HANDS_CTRL", position: [285, 1310] },
            { name: "FULL_BODY_SPINE_CTRL", position: [540, 980] },
            { name: "FULL_BODY_HIPS_CTRL", position: [545, 820] },
            { name: "FULL_BODY_HEELS_CTRL", position: [730, 1500] }
        ],
        bubbles: [
            { name: "CUE_01", start: 5, end: 10, text: "Root through your hands", bubblePos: [775, 1180], targetCtrl: "GLOW_HANDS_CTRL", glowTarget: "GLOW_HANDS_CTRL", glowScale: [75, 48] },
            { name: "CUE_02", start: 10, end: 15, text: "Engage your arms", bubblePos: [815, 1060], targetCtrl: "GLOW_ARMS_CTRL", glowTarget: "GLOW_ARMS_CTRL", glowScale: [90, 180] },
            { name: "CUE_03", start: 15, end: 20, text: "Lengthen your spine", bubblePos: [770, 915], targetCtrl: "GLOW_SPINE_CTRL", glowTarget: "GLOW_SPINE_CTRL", glowScale: [85, 210] },
            { name: "CUE_04", start: 20, end: 25, text: "Lift your hips up and back", bubblePos: [780, 765], targetCtrl: "GLOW_HIPS_CTRL", glowTarget: "GLOW_HIPS_CTRL", glowScale: [120, 90] },
            { name: "CUE_05", start: 25, end: 30, text: "Engage your legs", bubblePos: [770, 1285], targetCtrl: "GLOW_LEGS_CTRL", glowTarget: "GLOW_LEGS_CTRL", glowScale: [120, 260] },
            { name: "CUE_06", start: 30, end: 35, text: "Press your heels down", bubblePos: [785, 1460], targetCtrl: "GLOW_HEELS_CTRL", glowTarget: "GLOW_HEELS_CTRL", glowScale: [85, 65] },
            { name: "CUE_07", start: 35, end: 40, text: "Relax your neck", bubblePos: [780, 675], targetCtrl: "GLOW_NECK_CTRL", glowTarget: "GLOW_NECK_CTRL", glowScale: [110, 95] },
            { name: "CUE_08", start: 45, end: 50, text: "Full body connection", bubblePos: [790, 980], targetCtrl: "FULL_BODY_SPINE_CTRL", fullBodyOverlay: true }
        ],
        centerMoments: [
            { name: "OPENING_BREATH", start: 0, end: 5, text: "Center. Connect. Begin to breathe." },
            { name: "EXHALE_RESET", start: 40, end: 45, text: "Exhale. Let go." },
            { name: "STAY_FOR_FIVE", start: 50, end: 55, text: "Stay for 5 breaths", withBreathCircle: true }
        ],
        closingCta: {
            start: 55,
            end: 60,
            text: "Save this for your next practice",
            showLogo: true
        }
    };

    function findItemByName(name) {
        var i;
        for (i = 1; i <= app.project.numItems; i += 1) {
            if (app.project.item(i).name === name) {
                return app.project.item(i);
            }
        }
        return null;
    }

    function ensureFolder(name, parentFolder) {
        var existing = findItemByName(name);
        if (existing && existing instanceof FolderItem) {
            return existing;
        }
        var folder = app.project.items.addFolder(name);
        if (parentFolder) {
            folder.parentFolder = parentFolder;
        }
        return folder;
    }

    function ensureComp(name, width, height, pixelAspect, duration, fps, parentFolder) {
        var existing = findItemByName(name);
        if (existing && existing instanceof CompItem) {
            return existing;
        }
        var comp = app.project.items.addComp(name, width, height, pixelAspect, duration, fps);
        if (parentFolder) {
            comp.parentFolder = parentFolder;
        }
        return comp;
    }

    function clearComp(comp) {
        while (comp.numLayers > 0) {
            comp.layer(1).remove();
        }
    }

    function hexAccent() {
        return "#CF6F1A";
    }

    function pickFont() {
        try {
            return REEL_CONFIG.fontPrimary;
        } catch (err) {
            return REEL_CONFIG.fontFallback;
        }
    }

    function setText(layer, value, size, tracking, justification) {
        var doc = layer.property("Source Text").value;
        doc.resetCharStyle();
        doc.resetParagraphStyle();
        doc.text = value;
        doc.font = pickFont();
        doc.fontSize = size;
        doc.fillColor = REEL_CONFIG.colors.cream;
        doc.tracking = tracking;
        doc.justification = justification;
        doc.applyFill = true;
        doc.applyStroke = false;
        layer.property("Source Text").setValue(doc);
    }

    function addRoundedRectShape(comp, layerName, size, radius, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth) {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = layerName;

        var contents = shapeLayer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Rounded Box";

        var inner = group.property("Contents");
        var rect = inner.addProperty("ADBE Vector Shape - Rect");
        rect.property("Size").setValue(size);
        rect.property("Roundness").setValue(radius);

        var fill = inner.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(fillColor);
        fill.property("Opacity").setValue(fillOpacity);

        var stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(strokeColor);
        stroke.property("Opacity").setValue(strokeOpacity);
        stroke.property("Stroke Width").setValue(strokeWidth);

        return shapeLayer;
    }

    function addEllipseGlowShape(comp, layerName, size, fillColor, fillOpacity, blurAmount) {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = layerName;

        var contents = shapeLayer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Glow Ellipse";

        var inner = group.property("Contents");
        var ellipse = inner.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("Size").setValue(size);

        var fill = inner.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(fillColor);
        fill.property("Opacity").setValue(fillOpacity);

        var blur = shapeLayer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(blurAmount);
        blur.property("Repeat Edge Pixels").setValue(true);

        return shapeLayer;
    }

    function addBreathCircleShape(comp) {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = "BREATH_CIRCLE__RING";

        var contents = shapeLayer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Breath Ring";

        var inner = group.property("Contents");
        var ellipse = inner.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("Size").setValue([360, 360]);

        var stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(REEL_CONFIG.colors.line);
        stroke.property("Opacity").setValue(55);
        stroke.property("Stroke Width").setValue(2.2);

        var fill = inner.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(REEL_CONFIG.colors.accent);
        fill.property("Opacity").setValue(7);

        shapeLayer.property("Transform").property("Position").setValue([250, 250]);
        shapeLayer.property("Transform").property("Scale").expression =
            "freq = 0.14;\n" +
            "amp = 7;\n" +
            "base = 100;\n" +
            "s = base + Math.sin(time * Math.PI * 2 * freq) * amp;\n" +
            "[s, s];";

        var blur = shapeLayer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(28);
        blur.property("Repeat Edge Pixels").setValue(true);

        return shapeLayer;
    }

    function addNull(comp, name, position, labelIndex) {
        var layer = comp.layers.addNull();
        layer.name = name;
        layer.threeDLayer = false;
        layer.label = labelIndex || 11;
        layer.property("Transform").property("Position").setValue(position);
        return layer;
    }

    function applyFadeAndScale(layer, startTime, endTime) {
        var opacity = layer.property("Transform").property("Opacity");
        var scale = layer.property("Transform").property("Scale");

        layer.startTime = 0;
        layer.inPoint = startTime;
        layer.outPoint = endTime;

        opacity.setValueAtTime(startTime, 0);
        opacity.setValueAtTime(startTime + 0.55, 100);
        opacity.setValueAtTime(endTime - 0.55, 100);
        opacity.setValueAtTime(endTime, 0);

        scale.setValueAtTime(startTime, [96, 96]);
        scale.setValueAtTime(startTime + 0.55, [REEL_CONFIG.cueDefaults.bubbleScaleIn, REEL_CONFIG.cueDefaults.bubbleScaleIn]);
        scale.setValueAtTime(startTime + 1.1, [REEL_CONFIG.cueDefaults.bubbleScaleRest, REEL_CONFIG.cueDefaults.bubbleScaleRest]);
        scale.setValueAtTime(endTime, [REEL_CONFIG.cueDefaults.bubbleScaleRest, REEL_CONFIG.cueDefaults.bubbleScaleRest]);
    }

    function applyFadeOnly(layer, startTime, endTime, peakOpacity) {
        var opacity = layer.property("Transform").property("Opacity");
        layer.inPoint = startTime;
        layer.outPoint = endTime;
        opacity.setValueAtTime(startTime, 0);
        opacity.setValueAtTime(startTime + 0.6, peakOpacity);
        opacity.setValueAtTime(endTime - 0.6, peakOpacity);
        opacity.setValueAtTime(endTime, 0);
    }

    function createThoughtBubbleTemplate(parentFolder) {
        var comp = ensureComp("THOUGHT_BUBBLE__TEMPLATE", 640, 220, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);

        var bubble = addRoundedRectShape(
            comp,
            "Bubble_Backplate",
            [620, 190],
            38,
            REEL_CONFIG.colors.softCream,
            18,
            REEL_CONFIG.colors.line,
            45,
            1.25
        );
        bubble.property("Transform").property("Position").setValue([320, 110]);

        var innerGlow = addRoundedRectShape(
            comp,
            "Bubble_Accent_Frame",
            [620, 190],
            38,
            REEL_CONFIG.colors.accent,
            0,
            REEL_CONFIG.colors.accent,
            28,
            1.8
        );
        innerGlow.property("Transform").property("Position").setValue([320, 110]);
        var accentBlur = innerGlow.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        accentBlur.property("Blurriness").setValue(9);
        accentBlur.property("Repeat Edge Pixels").setValue(true);

        var textLayer = comp.layers.addText("Thought bubble text");
        textLayer.name = "Bubble_Text";
        setText(textLayer, "Thought bubble text", 44, 8, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([320, 108]);

        return comp;
    }

    function createGlowTemplate(parentFolder) {
        var comp = ensureComp("GLOW_HIGHLIGHT__TEMPLATE", 340, 340, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);

        var coreGlow = addEllipseGlowShape(comp, "Glow_Core", [160, 100], REEL_CONFIG.colors.accent, 32, 38);
        coreGlow.property("Transform").property("Position").setValue([170, 170]);

        var outerGlow = addEllipseGlowShape(comp, "Glow_Outer", [220, 150], REEL_CONFIG.colors.accent, 14, 72);
        outerGlow.property("Transform").property("Position").setValue([170, 170]);

        comp.layer("Glow_Core").property("Transform").property("Opacity").expression =
            "base = 46; amp = 12; freq = 0.35; base + Math.sin(time * Math.PI * 2 * freq) * amp;";
        comp.layer("Glow_Outer").property("Transform").property("Opacity").expression =
            "base = 18; amp = 8; freq = 0.35; base + Math.sin(time * Math.PI * 2 * freq + 0.6) * amp;";

        return comp;
    }

    function createBreathCircleTemplate(parentFolder) {
        var comp = ensureComp("BREATH_CIRCLE__TEMPLATE", 500, 500, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        addBreathCircleShape(comp);
        return comp;
    }

    function createClosingCtaTemplate(parentFolder) {
        var comp = ensureComp("CLOSING_CTA__TEMPLATE", 1080, 420, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);

        var textLayer = comp.layers.addText("Save this for your next practice");
        textLayer.name = "CTA_Text";
        setText(textLayer, "Save this for your next practice", 60, 16, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([540, 180]);

        var logoText = comp.layers.addText("Himalayan Institute");
        logoText.name = "CTA_Logo_Placeholder";
        setText(logoText, "Himalayan Institute", 28, 80, ParagraphJustification.CENTER_JUSTIFY);
        logoText.property("Transform").property("Position").setValue([540, 315]);
        logoText.property("Transform").property("Opacity").setValue(62);

        var line = comp.layers.addShape();
        line.name = "CTA_Accent_Line";
        var contents = line.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        var inner = group.property("Contents");
        var rect = inner.addProperty("ADBE Vector Shape - Rect");
        rect.property("Size").setValue([220, 3]);
        var fill = inner.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(REEL_CONFIG.colors.accent);
        fill.property("Opacity").setValue(100);
        line.property("Transform").property("Position").setValue([540, 255]);

        return comp;
    }

    function createFullBodyOverlayTemplate(parentFolder, mainCompName) {
        var comp = ensureComp("FULL_BODY_CONNECTION__TEMPLATE", REEL_CONFIG.width, REEL_CONFIG.height, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);

        function addLinkedGlow(name, ctrlName, size) {
            var layer = addEllipseGlowShape(comp, name, size, REEL_CONFIG.colors.accent, 22, 48);
            layer.property("Transform").property("Position").expression =
                "comp(\"" + mainCompName + "\").layer(\"" + ctrlName + "\").transform.position;";
            layer.property("Transform").property("Opacity").expression =
                "base = 22; amp = 8; freq = 0.26; base + Math.sin(time * Math.PI * 2 * freq) * amp;";
        }

        addLinkedGlow("FB_Hands_Glow", "FULL_BODY_HANDS_CTRL", [170, 90]);
        addLinkedGlow("FB_Spine_Glow", "FULL_BODY_SPINE_CTRL", [110, 220]);
        addLinkedGlow("FB_Hips_Glow", "FULL_BODY_HIPS_CTRL", [155, 110]);
        addLinkedGlow("FB_Heels_Glow", "FULL_BODY_HEELS_CTRL", [155, 90]);

        return comp;
    }

    function duplicateCompWithName(comp, newName, parentFolder) {
        var existing = findItemByName(newName);
        if (existing && existing instanceof CompItem) {
            return existing;
        }
        var dup = comp.duplicate();
        dup.name = newName;
        if (parentFolder) {
            dup.parentFolder = parentFolder;
        }
        return dup;
    }

    function addConnectorLine(mainComp, bubbleCtrlName, targetCtrlName, layerName) {
        var shapeLayer = mainComp.layers.addShape();
        shapeLayer.name = layerName;
        var contents = shapeLayer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Connector";
        var inner = group.property("Contents");
        var path = inner.addProperty("ADBE Vector Shape - Group");
        var stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(REEL_CONFIG.colors.line);
        stroke.property("Opacity").setValue(65);
        stroke.property("Stroke Width").setValue(2);

        var dashes = stroke.property("Dashes");
        if (dashes) {
            var dash1 = dashes.addProperty("ADBE Vector Stroke Dash 1");
            dash1.setValue(8);
            var gap1 = dashes.addProperty("ADBE Vector Stroke Gap 1");
            gap1.setValue(9);
        }

        path.property("Path").expression =
            "var bubble = thisComp.layer(\"" + bubbleCtrlName + "\").transform.position;\n" +
            "var target = thisComp.layer(\"" + targetCtrlName + "\").transform.position;\n" +
            "var start = [bubble[0] - 120, bubble[1] + 18];\n" +
            "var end = target;\n" +
            "createPath([start, end], [], [], false);";

        return shapeLayer;
    }

    function addFaceSafeGuide(mainComp) {
        var layer = mainComp.layers.addShape();
        layer.name = "FACE_SAFE_ZONE__GUIDE";
        var contents = layer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
        var inner = group.property("Contents");
        var rect = inner.addProperty("ADBE Vector Shape - Rect");
        rect.property("Size").setValue(REEL_CONFIG.faceSafeZone.size);
        rect.property("Roundness").setValue(36);
        var stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(REEL_CONFIG.colors.line);
        stroke.property("Opacity").setValue(35);
        stroke.property("Stroke Width").setValue(1.5);
        var dashes = stroke.property("Dashes");
        if (dashes) {
            var dash1 = dashes.addProperty("ADBE Vector Stroke Dash 1");
            dash1.setValue(18);
            var gap1 = dashes.addProperty("ADBE Vector Stroke Gap 1");
            gap1.setValue(14);
        }

        var text = mainComp.layers.addText("Keep face clear");
        text.name = "FACE_SAFE_ZONE__LABEL";
        setText(text, "Keep face clear", 24, 70, ParagraphJustification.CENTER_JUSTIFY);
        text.property("Transform").property("Opacity").setValue(40);
        text.property("Transform").property("Position").setValue([REEL_CONFIG.faceSafeZone.position[0], REEL_CONFIG.faceSafeZone.position[1] - 215]);

        layer.property("Transform").property("Position").setValue(REEL_CONFIG.faceSafeZone.position);
        layer.guideLayer = true;
        text.guideLayer = true;
    }

    function setLayerSourceText(precomp, layerName, textValue, size) {
        var layer = precomp.layer(layerName);
        setText(layer, textValue, size, layerName === "CTA_Text" ? 16 : 8, ParagraphJustification.CENTER_JUSTIFY);
    }

    function addCenterText(mainComp, cue, breathComp) {
        if (cue.withBreathCircle) {
            var breathLayer = mainComp.layers.add(breathComp);
            breathLayer.name = cue.name + "__BreathCircle";
            breathLayer.property("Transform").property("Position").setValue([540, 960]);
            breathLayer.property("Transform").property("Scale").setValue([80, 80]);
            applyFadeOnly(breathLayer, cue.start, cue.end, 70);
        }

        var textLayer = mainComp.layers.addText(cue.text);
        textLayer.name = cue.name + "__Centered_Text";
        setText(textLayer, cue.text, cue.name === "STAY_FOR_FIVE" ? 58 : 54, 24, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([540, cue.name === "STAY_FOR_FIVE" ? 955 : 990]);
        applyFadeOnly(textLayer, cue.start, cue.end, 100);
    }

    function addGlowInstance(mainComp, glowComp, cue) {
        var glowLayer = mainComp.layers.add(glowComp);
        glowLayer.name = cue.name + "__Glow";
        glowLayer.property("Transform").property("Position").expression =
            "thisComp.layer(\"" + cue.glowTarget + "\").transform.position;";
        glowLayer.property("Transform").property("Scale").setValue(cue.glowScale);
        applyFadeOnly(glowLayer, cue.start, cue.end, 100);
    }

    function addFullBodyInstance(mainComp, fullBodyComp, cue) {
        var layer = mainComp.layers.add(fullBodyComp);
        layer.name = cue.name + "__FullBody_Overlay";
        layer.property("Transform").property("Position").setValue([540, 960]);
        applyFadeOnly(layer, cue.start, cue.end, 100);
    }

    function addBubbleInstance(mainComp, bubbleTemplate, cue, cueFolder) {
        var cueComp = duplicateCompWithName(bubbleTemplate, cue.name + "__THOUGHT_BUBBLE", cueFolder);
        setLayerSourceText(cueComp, "Bubble_Text", cue.text, 44);

        var ctrl = addNull(mainComp, cue.name + "__BUBBLE_CTRL", cue.bubblePos, 9);

        var bubbleLayer = mainComp.layers.add(cueComp);
        bubbleLayer.name = cue.name + "__Bubble";
        bubbleLayer.property("Transform").property("Position").expression =
            "thisComp.layer(\"" + ctrl.name + "\").transform.position;";
        applyFadeAndScale(bubbleLayer, cue.start, cue.end);

        var connector = addConnectorLine(mainComp, ctrl.name, cue.targetCtrl, cue.name + "__Connector");
        applyFadeOnly(connector, cue.start, cue.end, 100);

        return {
            bubbleControl: ctrl,
            bubbleLayer: bubbleLayer,
            connectorLayer: connector
        };
    }

    var rootFolder = ensureFolder("HI_Motion_Graphics");
    var aeFolder = ensureFolder("After_Effects_Templates", rootFolder);
    var moduleFolder = ensureFolder("HI_Modules", aeFolder);
    var cueFolder = ensureFolder("HI_Cue_Comps", aeFolder);

    var bubbleTemplate = createThoughtBubbleTemplate(moduleFolder);
    var glowTemplate = createGlowTemplate(moduleFolder);
    var breathTemplate = createBreathCircleTemplate(moduleFolder);
    var ctaTemplate = createClosingCtaTemplate(moduleFolder);
    var mainComp = ensureComp(REEL_CONFIG.compName, REEL_CONFIG.width, REEL_CONFIG.height, 1, REEL_CONFIG.duration, REEL_CONFIG.fps, aeFolder);
    clearComp(mainComp);
    var fullBodyTemplate = createFullBodyOverlayTemplate(moduleFolder, REEL_CONFIG.compName);

    var footagePlaceholder = mainComp.layers.addSolid([0.10, 0.12, 0.11], "REPLACE_WITH_POSTURE_FOOTAGE__KEEP_FACE_CLEAR", REEL_CONFIG.width, REEL_CONFIG.height, 1, REEL_CONFIG.duration);
    footagePlaceholder.label = 3;

    var footageNote = mainComp.layers.addText("Replace this solid with posture footage.\rDo not cover or distort the practitioner's face.");
    footageNote.name = "FOOTAGE_SWAP_NOTE";
    setText(footageNote, "Replace this solid with posture footage.\rDo not cover or distort the practitioner's face.", 30, 30, ParagraphJustification.CENTER_JUSTIFY);
    footageNote.property("Transform").property("Position").setValue([540, 1680]);
    footageNote.property("Transform").property("Opacity").setValue(55);

    addFaceSafeGuide(mainComp);

    var masterControl = addNull(mainComp, "MASTER_STYLE_CTRL", [100, 100], 14);
    masterControl.enabled = false;
    masterControl.shy = true;

    var i;
    for (i = 0; i < REEL_CONFIG.controlPoints.length; i += 1) {
        addNull(mainComp, REEL_CONFIG.controlPoints[i].name, REEL_CONFIG.controlPoints[i].position, 10);
    }

    for (i = 0; i < REEL_CONFIG.centerMoments.length; i += 1) {
        var centerCue = REEL_CONFIG.centerMoments[i];
        if (centerCue.name === "OPENING_BREATH" || centerCue.name === "EXHALE_RESET") {
            var breathLayer = mainComp.layers.add(breathTemplate);
            breathLayer.name = centerCue.name + "__BreathCircle";
            breathLayer.property("Transform").property("Position").setValue([540, 950]);
            breathLayer.property("Transform").property("Scale").setValue([78, 78]);
            applyFadeOnly(breathLayer, centerCue.start, centerCue.end, 65);
        }
        addCenterText(mainComp, centerCue, breathTemplate);
    }

    for (i = 0; i < REEL_CONFIG.bubbles.length; i += 1) {
        var cue = REEL_CONFIG.bubbles[i];
        addBubbleInstance(mainComp, bubbleTemplate, cue, cueFolder);
        if (cue.fullBodyOverlay) {
            addFullBodyInstance(mainComp, fullBodyTemplate, cue);
        } else {
            addGlowInstance(mainComp, glowTemplate, cue);
        }
    }

    var closingComp = duplicateCompWithName(ctaTemplate, "DOWNWARD_DOG__CLOSING_CTA", cueFolder);
    setLayerSourceText(closingComp, "CTA_Text", REEL_CONFIG.closingCta.text, 60);
    if (!REEL_CONFIG.closingCta.showLogo) {
        closingComp.layer("CTA_Logo_Placeholder").enabled = false;
    }

    var closingLayer = mainComp.layers.add(closingComp);
    closingLayer.name = "CLOSING_CTA__INSTANCE";
    closingLayer.property("Transform").property("Position").setValue([540, 1580]);
    applyFadeOnly(closingLayer, REEL_CONFIG.closingCta.start, REEL_CONFIG.closingCta.end, 100);

    mainComp.openInViewer();

    alert(
        "HI yoga posture reel template created.\n\n" +
        "Open comp: " + REEL_CONFIG.compName + "\n" +
        "Move *_CTRL nulls to adjust glow targets and bubble positions.\n" +
        "Replace the footage placeholder with your posture clip."
    );

    app.endUndoGroup();
}());
