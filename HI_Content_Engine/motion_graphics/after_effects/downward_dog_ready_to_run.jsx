/*
  downward_dog_ready_to_run.jsx

  Ready-to-run preset for the Himalayan Institute Downward Dog posture reel.
  No edits required before running.

  In After Effects:
  1. File > Scripts > Run Script File...
  2. Choose this file
  3. Open DOWNWARD_DOG__MASTER
  4. Replace the footage placeholder with your clip
*/

(function buildReadyDownwardDogReel() {
    if (!app.project) {
        app.newProject();
    }

    app.beginUndoGroup("Build Ready Downward Dog Reel");

    var EASY_EDIT = {
        postureName: "Downward Dog",
        compPrefix: "DOWNWARD_DOG",
        openingText: "Center. Connect. Begin to breathe.",
        exhaleText: "Exhale. Let go.",
        stayText: "Stay for 5 breaths",
        ctaText: "Save this for your next practice",
        showLogo: true,
        cues: [
            { start: 5, end: 10, text: "Root through your hands", target: "HANDS" },
            { start: 10, end: 15, text: "Engage your arms", target: "ARMS" },
            { start: 15, end: 20, text: "Lengthen your spine", target: "SPINE" },
            { start: 20, end: 25, text: "Lift your hips up and back", target: "HIPS" },
            { start: 25, end: 30, text: "Engage your legs", target: "LEGS" },
            { start: 30, end: 35, text: "Press your heels down", target: "HEELS" },
            { start: 35, end: 40, text: "Relax your neck", target: "NECK" },
            { start: 45, end: 50, text: "Full body connection", target: "FULL_BODY" }
        ]
    };

    var TARGET_LIBRARY = {
        HANDS: { ctrlName: "GLOW_HANDS_CTRL", position: [285, 1310], glowScale: [75, 48] },
        ARMS: { ctrlName: "GLOW_ARMS_CTRL", position: [350, 1160], glowScale: [90, 180] },
        SPINE: { ctrlName: "GLOW_SPINE_CTRL", position: [540, 980], glowScale: [85, 210] },
        HIPS: { ctrlName: "GLOW_HIPS_CTRL", position: [545, 820], glowScale: [120, 90] },
        LEGS: { ctrlName: "GLOW_LEGS_CTRL", position: [625, 1210], glowScale: [120, 260] },
        HEELS: { ctrlName: "GLOW_HEELS_CTRL", position: [730, 1500], glowScale: [85, 65] },
        NECK: { ctrlName: "GLOW_NECK_CTRL", position: [540, 720], glowScale: [110, 95] },
        FULL_BODY_HANDS: { ctrlName: "FULL_BODY_HANDS_CTRL", position: [285, 1310] },
        FULL_BODY_SPINE: { ctrlName: "FULL_BODY_SPINE_CTRL", position: [540, 980] },
        FULL_BODY_HIPS: { ctrlName: "FULL_BODY_HIPS_CTRL", position: [545, 820] },
        FULL_BODY_HEELS: { ctrlName: "FULL_BODY_HEELS_CTRL", position: [730, 1500] }
    };

    var DEFAULT_BUBBLE_POSITIONS = [
        [775, 1180],
        [815, 1060],
        [770, 915],
        [780, 765],
        [770, 1285],
        [785, 1460],
        [780, 675],
        [790, 980]
    ];

    function cueName(index) {
        return index < 10 ? "CUE_0" + index : "CUE_" + index;
    }

    function buildConfig() {
        var bubbles = [];
        var controls = [];
        var seen = {};
        var i;

        function addControl(name, position) {
            if (seen[name]) {
                return;
            }
            seen[name] = true;
            controls.push({ name: name, position: position });
        }

        for (i = 0; i < EASY_EDIT.cues.length; i += 1) {
            var cue = EASY_EDIT.cues[i];
            if (cue.target === "FULL_BODY") {
                bubbles.push({
                    name: cueName(i + 1),
                    start: cue.start,
                    end: cue.end,
                    text: cue.text,
                    bubblePos: DEFAULT_BUBBLE_POSITIONS[i],
                    targetCtrl: TARGET_LIBRARY.FULL_BODY_SPINE.ctrlName,
                    fullBodyOverlay: true
                });
                addControl(TARGET_LIBRARY.FULL_BODY_HANDS.ctrlName, TARGET_LIBRARY.FULL_BODY_HANDS.position);
                addControl(TARGET_LIBRARY.FULL_BODY_SPINE.ctrlName, TARGET_LIBRARY.FULL_BODY_SPINE.position);
                addControl(TARGET_LIBRARY.FULL_BODY_HIPS.ctrlName, TARGET_LIBRARY.FULL_BODY_HIPS.position);
                addControl(TARGET_LIBRARY.FULL_BODY_HEELS.ctrlName, TARGET_LIBRARY.FULL_BODY_HEELS.position);
            } else {
                var target = TARGET_LIBRARY[cue.target];
                bubbles.push({
                    name: cueName(i + 1),
                    start: cue.start,
                    end: cue.end,
                    text: cue.text,
                    bubblePos: DEFAULT_BUBBLE_POSITIONS[i],
                    targetCtrl: target.ctrlName,
                    glowTarget: target.ctrlName,
                    glowScale: target.glowScale
                });
                addControl(target.ctrlName, target.position);
            }
        }

        return {
            width: 1080,
            height: 1920,
            duration: 60,
            fps: 30,
            compName: EASY_EDIT.compPrefix + "__MASTER",
            faceSafeZone: { position: [540, 300], size: [360, 340] },
            colors: {
                accent: [0.8118, 0.4353, 0.1020],
                cream: [0.9725, 0.9490, 0.9020],
                softCream: [0.9882, 0.9765, 0.9451],
                line: [0.9451, 0.9137, 0.8667]
            },
            fontPrimary: "Gotham",
            fontFallback: "ArialMT",
            controlPoints: controls,
            bubbles: bubbles,
            centerMoments: [
                { name: "OPENING_BREATH", start: 0, end: 5, text: EASY_EDIT.openingText },
                { name: "EXHALE_RESET", start: 40, end: 45, text: EASY_EDIT.exhaleText },
                { name: "STAY_FOR_FIVE", start: 50, end: 55, text: EASY_EDIT.stayText, withBreathCircle: true }
            ],
            closingCta: {
                start: 55,
                end: 60,
                text: EASY_EDIT.ctaText,
                showLogo: EASY_EDIT.showLogo
            }
        };
    }

    var REEL_CONFIG = buildConfig();

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

    function pickFont() {
        return REEL_CONFIG.fontPrimary || REEL_CONFIG.fontFallback;
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

    function addNull(comp, name, position, labelIndex) {
        var layer = comp.layers.addNull();
        layer.name = name;
        layer.label = labelIndex || 11;
        layer.property("Transform").property("Position").setValue(position);
        return layer;
    }

    function applyFadeAndScale(layer, startTime, endTime) {
        var opacity = layer.property("Transform").property("Opacity");
        var scale = layer.property("Transform").property("Scale");
        layer.inPoint = startTime;
        layer.outPoint = endTime;
        opacity.setValueAtTime(startTime, 0);
        opacity.setValueAtTime(startTime + 0.55, 100);
        opacity.setValueAtTime(endTime - 0.55, 100);
        opacity.setValueAtTime(endTime, 0);
        scale.setValueAtTime(startTime, [96, 96]);
        scale.setValueAtTime(startTime + 0.55, [108, 108]);
        scale.setValueAtTime(startTime + 1.1, [100, 100]);
        scale.setValueAtTime(endTime, [100, 100]);
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
        var comp = ensureComp("THOUGHT_BUBBLE__TEMPLATE__READY", 640, 220, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        var bubble = addRoundedRectShape(comp, "Bubble_Backplate", [620, 190], 38, REEL_CONFIG.colors.cream, 18, REEL_CONFIG.colors.line, 45, 1.25);
        bubble.property("Transform").property("Position").setValue([320, 110]);
        var accent = addRoundedRectShape(comp, "Bubble_Accent_Frame", [620, 190], 38, REEL_CONFIG.colors.accent, 0, REEL_CONFIG.colors.accent, 28, 1.8);
        accent.property("Transform").property("Position").setValue([320, 110]);
        var blur = accent.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(9);
        blur.property("Repeat Edge Pixels").setValue(true);
        var textLayer = comp.layers.addText("Thought bubble text");
        textLayer.name = "Bubble_Text";
        setText(textLayer, "Thought bubble text", 44, 8, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([320, 108]);
        return comp;
    }

    function createGlowTemplate(parentFolder) {
        var comp = ensureComp("GLOW_HIGHLIGHT__TEMPLATE__READY", 340, 340, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        var core = addEllipseGlowShape(comp, "Glow_Core", [160, 100], REEL_CONFIG.colors.accent, 32, 38);
        core.property("Transform").property("Position").setValue([170, 170]);
        var outer = addEllipseGlowShape(comp, "Glow_Outer", [220, 150], REEL_CONFIG.colors.accent, 14, 72);
        outer.property("Transform").property("Position").setValue([170, 170]);
        core.property("Transform").property("Opacity").expression = "base = 46; amp = 12; freq = 0.35; base + Math.sin(time * Math.PI * 2 * freq) * amp;";
        outer.property("Transform").property("Opacity").expression = "base = 18; amp = 8; freq = 0.35; base + Math.sin(time * Math.PI * 2 * freq + 0.6) * amp;";
        return comp;
    }

    function createBreathCircleTemplate(parentFolder) {
        var comp = ensureComp("BREATH_CIRCLE__TEMPLATE__READY", 500, 500, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = "BREATH_CIRCLE__RING";
        var contents = shapeLayer.property("Contents");
        var group = contents.addProperty("ADBE Vector Group");
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
        shapeLayer.property("Transform").property("Scale").expression = "freq = 0.14; amp = 7; base = 100; s = base + Math.sin(time * Math.PI * 2 * freq) * amp; [s, s];";
        var blur = shapeLayer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(28);
        blur.property("Repeat Edge Pixels").setValue(true);
        return comp;
    }

    function createClosingCtaTemplate(parentFolder) {
        var comp = ensureComp("CLOSING_CTA__TEMPLATE__READY", 1080, 420, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        var textLayer = comp.layers.addText(REEL_CONFIG.closingCta.text);
        textLayer.name = "CTA_Text";
        setText(textLayer, REEL_CONFIG.closingCta.text, 60, 16, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([540, 180]);
        var logoText = comp.layers.addText("Himalayan Institute");
        logoText.name = "CTA_Logo_Placeholder";
        setText(logoText, "Himalayan Institute", 28, 80, ParagraphJustification.CENTER_JUSTIFY);
        logoText.property("Transform").property("Position").setValue([540, 315]);
        logoText.property("Transform").property("Opacity").setValue(62);
        if (!REEL_CONFIG.closingCta.showLogo) {
            logoText.enabled = false;
        }
        return comp;
    }

    function createFullBodyOverlayTemplate(parentFolder, mainCompName) {
        var comp = ensureComp("FULL_BODY_CONNECTION__TEMPLATE__READY", REEL_CONFIG.width, REEL_CONFIG.height, 1, 8, REEL_CONFIG.fps, parentFolder);
        clearComp(comp);
        function addLinkedGlow(name, ctrlName, size) {
            var layer = addEllipseGlowShape(comp, name, size, REEL_CONFIG.colors.accent, 22, 48);
            layer.property("Transform").property("Position").expression = "comp(\"" + mainCompName + "\").layer(\"" + ctrlName + "\").transform.position;";
            layer.property("Transform").property("Opacity").expression = "base = 22; amp = 8; freq = 0.26; base + Math.sin(time * Math.PI * 2 * freq) * amp;";
        }
        addLinkedGlow("FB_Hands_Glow", TARGET_LIBRARY.FULL_BODY_HANDS.ctrlName, [170, 90]);
        addLinkedGlow("FB_Spine_Glow", TARGET_LIBRARY.FULL_BODY_SPINE.ctrlName, [110, 220]);
        addLinkedGlow("FB_Hips_Glow", TARGET_LIBRARY.FULL_BODY_HIPS.ctrlName, [155, 110]);
        addLinkedGlow("FB_Heels_Glow", TARGET_LIBRARY.FULL_BODY_HEELS.ctrlName, [155, 90]);
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
        var inner = group.property("Contents");
        var path = inner.addProperty("ADBE Vector Shape - Group");
        var stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(REEL_CONFIG.colors.line);
        stroke.property("Opacity").setValue(65);
        stroke.property("Stroke Width").setValue(2);
        var dashes = stroke.property("Dashes");
        if (dashes) {
            dashes.addProperty("ADBE Vector Stroke Dash 1").setValue(8);
            dashes.addProperty("ADBE Vector Stroke Gap 1").setValue(9);
        }
        path.property("Path").expression =
            "var bubble = thisComp.layer(\"" + bubbleCtrlName + "\").transform.position;\n" +
            "var target = thisComp.layer(\"" + targetCtrlName + "\").transform.position;\n" +
            "var start = [bubble[0] - 120, bubble[1] + 18];\n" +
            "createPath([start, target], [], [], false);";
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
        layer.property("Transform").property("Position").setValue(REEL_CONFIG.faceSafeZone.position);
        layer.guideLayer = true;
    }

    function addBubbleInstance(mainComp, bubbleTemplate, cue, cueFolder) {
        var cueComp = duplicateCompWithName(bubbleTemplate, cue.name + "__BUBBLE__READY", cueFolder);
        var textLayer = cueComp.layer("Bubble_Text");
        setText(textLayer, cue.text, 44, 8, ParagraphJustification.CENTER_JUSTIFY);
        var ctrl = addNull(mainComp, cue.name + "__BUBBLE_CTRL", cue.bubblePos, 9);
        var bubbleLayer = mainComp.layers.add(cueComp);
        bubbleLayer.name = cue.name + "__Bubble";
        bubbleLayer.property("Transform").property("Position").expression = "thisComp.layer(\"" + ctrl.name + "\").transform.position;";
        applyFadeAndScale(bubbleLayer, cue.start, cue.end);
        var connector = addConnectorLine(mainComp, ctrl.name, cue.targetCtrl, cue.name + "__Connector");
        applyFadeOnly(connector, cue.start, cue.end, 100);
    }

    function addGlowInstance(mainComp, glowComp, cue) {
        var glowLayer = mainComp.layers.add(glowComp);
        glowLayer.name = cue.name + "__Glow";
        glowLayer.property("Transform").property("Position").expression = "thisComp.layer(\"" + cue.glowTarget + "\").transform.position;";
        glowLayer.property("Transform").property("Scale").setValue(cue.glowScale);
        applyFadeOnly(glowLayer, cue.start, cue.end, 100);
    }

    function addFullBodyInstance(mainComp, fullBodyComp, cue) {
        var layer = mainComp.layers.add(fullBodyComp);
        layer.name = cue.name + "__FullBody_Overlay";
        layer.property("Transform").property("Position").setValue([540, 960]);
        applyFadeOnly(layer, cue.start, cue.end, 100);
    }

    function addCenterText(mainComp, cue, breathComp) {
        if (cue.name === "OPENING_BREATH" || cue.name === "EXHALE_RESET" || cue.withBreathCircle) {
            var breathLayer = mainComp.layers.add(breathComp);
            breathLayer.name = cue.name + "__BreathCircle";
            breathLayer.property("Transform").property("Position").setValue([540, 950]);
            breathLayer.property("Transform").property("Scale").setValue([78, 78]);
            applyFadeOnly(breathLayer, cue.start, cue.end, cue.withBreathCircle ? 70 : 65);
        }
        var textLayer = mainComp.layers.addText(cue.text);
        textLayer.name = cue.name + "__Centered_Text";
        setText(textLayer, cue.text, cue.withBreathCircle ? 58 : 54, 24, ParagraphJustification.CENTER_JUSTIFY);
        textLayer.property("Transform").property("Position").setValue([540, cue.withBreathCircle ? 955 : 990]);
        applyFadeOnly(textLayer, cue.start, cue.end, 100);
    }

    var rootFolder = ensureFolder("HI_Motion_Graphics");
    var readyFolder = ensureFolder("After_Effects_Templates__Ready", rootFolder);
    var moduleFolder = ensureFolder("HI_Modules__Ready", readyFolder);
    var cueFolder = ensureFolder("HI_Cue_Comps__Ready", readyFolder);

    var bubbleTemplate = createThoughtBubbleTemplate(moduleFolder);
    var glowTemplate = createGlowTemplate(moduleFolder);
    var breathTemplate = createBreathCircleTemplate(moduleFolder);
    var ctaTemplate = createClosingCtaTemplate(moduleFolder);
    var mainComp = ensureComp(REEL_CONFIG.compName, REEL_CONFIG.width, REEL_CONFIG.height, 1, REEL_CONFIG.duration, REEL_CONFIG.fps, readyFolder);
    clearComp(mainComp);
    var fullBodyTemplate = createFullBodyOverlayTemplate(moduleFolder, REEL_CONFIG.compName);

    var footagePlaceholder = mainComp.layers.addSolid([0.10, 0.12, 0.11], "REPLACE_WITH_POSTURE_FOOTAGE__KEEP_FACE_CLEAR", REEL_CONFIG.width, REEL_CONFIG.height, 1, REEL_CONFIG.duration);
    footagePlaceholder.label = 3;
    var note = mainComp.layers.addText("Replace this solid with posture footage.\rMove the *_CTRL nulls if needed.");
    note.name = "FOOTAGE_SWAP_NOTE";
    setText(note, "Replace this solid with posture footage.\rMove the *_CTRL nulls if needed.", 30, 30, ParagraphJustification.CENTER_JUSTIFY);
    note.property("Transform").property("Position").setValue([540, 1680]);
    note.property("Transform").property("Opacity").setValue(55);

    addFaceSafeGuide(mainComp);

    var i;
    for (i = 0; i < REEL_CONFIG.controlPoints.length; i += 1) {
        addNull(mainComp, REEL_CONFIG.controlPoints[i].name, REEL_CONFIG.controlPoints[i].position, 10);
    }
    for (i = 0; i < REEL_CONFIG.centerMoments.length; i += 1) {
        addCenterText(mainComp, REEL_CONFIG.centerMoments[i], breathTemplate);
    }
    for (i = 0; i < REEL_CONFIG.bubbles.length; i += 1) {
        addBubbleInstance(mainComp, bubbleTemplate, REEL_CONFIG.bubbles[i], cueFolder);
        if (REEL_CONFIG.bubbles[i].fullBodyOverlay) {
            addFullBodyInstance(mainComp, fullBodyTemplate, REEL_CONFIG.bubbles[i]);
        } else {
            addGlowInstance(mainComp, glowTemplate, REEL_CONFIG.bubbles[i]);
        }
    }

    var closingComp = duplicateCompWithName(ctaTemplate, REEL_CONFIG.compName + "__CLOSING_CTA", cueFolder);
    var closingLayer = mainComp.layers.add(closingComp);
    closingLayer.name = "CLOSING_CTA__INSTANCE";
    closingLayer.property("Transform").property("Position").setValue([540, 1580]);
    applyFadeOnly(closingLayer, REEL_CONFIG.closingCta.start, REEL_CONFIG.closingCta.end, 100);

    mainComp.openInViewer();
    alert("Ready Downward Dog reel template created.\n\nOpen comp: " + REEL_CONFIG.compName);
    app.endUndoGroup();
}());
