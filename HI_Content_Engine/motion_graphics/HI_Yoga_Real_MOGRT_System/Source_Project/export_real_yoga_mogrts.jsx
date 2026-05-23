app.beginUndoGroup("Export Real Yoga MOGRTs");

var ROOT = "/Users/creative/Documents/New project/HI_Content_Engine/motion_graphics/HI_Yoga_Real_MOGRT_System";
var MOGRT_DIR = ROOT + "/MOGRTS";
var PROJECT_PATH = ROOT + "/Source_Project/HI_Yoga_Real_MOGRT_System.aep";
var LOG_PATH = ROOT + "/Source_Project/export_real_yoga_mogrts.log";

function logLine(message) {
    var line = "[" + (new Date()).toUTCString() + "] " + message;
    try {
        $.writeln(line);
    } catch (err) {}
    try {
        var logFile = new File(LOG_PATH);
        if (logFile.open("a")) {
            logFile.writeln(line);
            logFile.close();
        }
    } catch (err2) {}
}

function ensureFolder(pathStr) {
    var f = new Folder(pathStr);
    if (!f.exists) f.create();
    return f;
}

function rgb(hex) {
    var clean = hex.replace("#", "");
    return [
        parseInt(clean.substr(0, 2), 16) / 255,
        parseInt(clean.substr(2, 2), 16) / 255,
        parseInt(clean.substr(4, 2), 16) / 255
    ];
}

var ORANGE = rgb("#CF6F1A");
var WARM_WHITE = rgb("#F6F0E8");
var CHARCOAL = rgb("#181512");

function sliderEffect(layer, name, value) {
    var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    fx.name = name;
    fx.property("Slider").setValue(value);
    return fx.property("Slider");
}

function colorEffect(layer, name, value) {
    var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
    fx.name = name;
    fx.property("Color").setValue(value);
    return fx.property("Color");
}

function checkboxEffect(layer, name, value) {
    var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
    fx.name = name;
    fx.property("Checkbox").setValue(value ? 1 : 0);
    return fx.property("Checkbox");
}

function addEGP(prop, comp, name) {
    try {
        if (prop.canAddToMotionGraphicsTemplate(comp)) {
            prop.addToMotionGraphicsTemplateAs(comp, name);
        }
    } catch (err) {}
}

function makeComp(name, seconds) {
    return app.project.items.addComp(name, 1080, 1920, 1, seconds || 5, 30);
}

function makeControls(comp, spec) {
    var ctrl = comp.layers.addNull();
    ctrl.name = "CONTROLS";
    ctrl.enabled = false;
    ctrl.shy = true;
    ctrl.guideLayer = true;
    ctrl.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);

    var props = {};
    for (var i = 0; i < spec.length; i++) {
        var item = spec[i];
        if (item.type === "slider") props[item.name] = sliderEffect(ctrl, item.name, item.value);
        if (item.type === "color") props[item.name] = colorEffect(ctrl, item.name, item.value);
        if (item.type === "checkbox") props[item.name] = checkboxEffect(ctrl, item.name, item.value);
    }
    return { layer: ctrl, props: props };
}

function fadeExpr() {
    return [
        "ctrl=thisComp.layer('CONTROLS');",
        "fi=Math.max(ctrl.effect('Fade In')('Slider'),0.001);",
        "hold=Math.max(ctrl.effect('Hold')('Slider'),0);",
        "fo=Math.max(ctrl.effect('Fade Out')('Slider'),0.001);",
        "t=time-inPoint;",
        "if (t < 0) 0",
        "else if (t < fi) linear(t,0,fi,0,100)",
        "else if (t < fi+hold) 100",
        "else if (t < fi+hold+fo) linear(t,fi+hold,fi+hold+fo,100,0)",
        "else 0"
    ].join("\n");
}

function pulseScaleExpr(sizeName, amountName, speedName) {
    return [
        "ctrl=thisComp.layer('CONTROLS');",
        "base=ctrl.effect('" + sizeName + "')('Slider');",
        "amt=ctrl.effect('" + amountName + "')('Slider');",
        "spd=ctrl.effect('" + speedName + "')('Slider');",
        "v=base + Math.sin((time-inPoint)*spd*Math.PI*2)*amt;",
        "[v,v]"
    ].join("\n");
}

function pulseOpacityExpr(opacityName, amountName, speedName) {
    return [
        "ctrl=thisComp.layer('CONTROLS');",
        "base=ctrl.effect('" + opacityName + "')('Slider');",
        "amt=ctrl.effect('" + amountName + "')('Slider');",
        "spd=ctrl.effect('" + speedName + "')('Slider');",
        "base + Math.sin((time-inPoint)*spd*Math.PI*2)*amt"
    ].join("\n");
}

function setTextStyle(layer, textValue, fontSize, colorValue, justify) {
    var d = layer.property("Source Text").value;
    d.text = textValue;
    try { d.font = "Gotham-Medium"; } catch (err) {}
    d.fontSize = fontSize;
    d.fillColor = colorValue;
    d.applyFill = true;
    d.applyStroke = false;
    if (justify !== undefined) d.justification = justify;
    layer.property("Source Text").setValue(d);
}

function addEllipseShape(layer, groupName, size, fillColorValue, strokeColorValue, strokeWidth, fillOpacity, strokeOpacity) {
    var contents = layer.property("ADBE Root Vectors Group");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = groupName;
    var gContents = group.property("ADBE Vectors Group");
    var ellipse = gContents.addProperty("ADBE Vector Shape - Ellipse");
    ellipse.property("ADBE Vector Ellipse Size").setValue(size);
    var fill = gContents.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(fillColorValue);
    fill.property("ADBE Vector Fill Opacity").setValue(fillOpacity);
    var stroke = gContents.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(strokeColorValue);
    stroke.property("ADBE Vector Stroke Width").setValue(strokeWidth);
    stroke.property("ADBE Vector Stroke Opacity").setValue(strokeOpacity);
    return { group: group, ellipse: ellipse, fill: fill, stroke: stroke };
}

function addRectShape(layer, groupName, size, roundness, fillColorValue, strokeColorValue, strokeWidth, fillOpacity, strokeOpacity) {
    var contents = layer.property("ADBE Root Vectors Group");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = groupName;
    var gContents = group.property("ADBE Vectors Group");
    var rect = gContents.addProperty("ADBE Vector Shape - Rect");
    rect.property("ADBE Vector Rect Size").setValue(size);
    rect.property("ADBE Vector Rect Roundness").setValue(roundness);
    var fill = gContents.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(fillColorValue);
    fill.property("ADBE Vector Fill Opacity").setValue(fillOpacity);
    var stroke = gContents.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(strokeColorValue);
    stroke.property("ADBE Vector Stroke Width").setValue(strokeWidth);
    stroke.property("ADBE Vector Stroke Opacity").setValue(strokeOpacity);
    return { group: group, rect: rect, fill: fill, stroke: stroke };
}

function addBlur(layer, amount) {
    try {
        var blur = layer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(amount);
        blur.property("Repeat Edge Pixels").setValue(true);
    } catch (err) {}
}

function addLineShape(layer) {
    var contents = layer.property("ADBE Root Vectors Group");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = "Line";
    var gContents = group.property("ADBE Vectors Group");
    var path = gContents.addProperty("ADBE Vector Shape - Group");
    var stroke = gContents.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(ORANGE);
    stroke.property("ADBE Vector Stroke Width").setValue(4);
    stroke.property("ADBE Vector Stroke Opacity").setValue(100);
    return { group: group, path: path, stroke: stroke };
}

function exportComp(comp) {
    logLine("Preparing export for " + comp.name);
    comp.openInEssentialGraphics();
    comp.motionGraphicsTemplateName = comp.name;
    logLine("Essential Graphics opened for " + comp.name);
    var ok = comp.exportAsMotionGraphicsTemplate(true, MOGRT_DIR);
    logLine("Export call returned for " + comp.name + ": " + ok);
    if (!ok) throw new Error("Failed to export " + comp.name);
}

function buildBodyGlowSweep() {
    var comp = makeComp("HI_BodyGlow_Sweep", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Glow Pos X", value: 540 },
        { type: "slider", name: "Glow Pos Y", value: 960 },
        { type: "slider", name: "Glow Size", value: 100 },
        { type: "slider", name: "Glow Width", value: 240 },
        { type: "slider", name: "Glow Height", value: 520 },
        { type: "slider", name: "Glow Opacity", value: 70 },
        { type: "slider", name: "Glow Softness", value: 80 },
        { type: "slider", name: "Pulse Speed", value: 0.35 },
        { type: "slider", name: "Pulse Amount", value: 6 },
        { type: "slider", name: "Rotation", value: 0 },
        { type: "slider", name: "Fade In", value: 0.35 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.5 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var glow = comp.layers.addShape();
    glow.name = "Glow Sweep";
    var sh = addEllipseShape(glow, "Glow", [240, 520], ORANGE, ORANGE, 4, 35, 100);
    addBlur(glow, 70);
    glow.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Glow Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Glow Pos Y')('Slider')]";
    glow.property("ADBE Transform Group").property("ADBE Rotation").expression =
        "thisComp.layer('CONTROLS').effect('Rotation')('Slider')";
    glow.property("ADBE Transform Group").property("ADBE Scale").expression = pulseScaleExpr("Glow Size", "Pulse Amount", "Pulse Speed");
    glow.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    sh.ellipse.property("ADBE Vector Ellipse Size").expression =
        "[thisComp.layer('CONTROLS').effect('Glow Width')('Slider'), thisComp.layer('CONTROLS').effect('Glow Height')('Slider')]";
    sh.fill.property("ADBE Vector Fill Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";
    sh.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";
    sh.fill.property("ADBE Vector Fill Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Glow Opacity')('Slider') * 0.5";
    sh.stroke.property("ADBE Vector Stroke Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Glow Opacity')('Slider')";

    addEGP(ctl.props["Glow Pos X"], comp, "Glow Pos X");
    addEGP(ctl.props["Glow Pos Y"], comp, "Glow Pos Y");
    addEGP(ctl.props["Glow Size"], comp, "Glow Size");
    addEGP(ctl.props["Glow Width"], comp, "Glow Width");
    addEGP(ctl.props["Glow Height"], comp, "Glow Height");
    addEGP(ctl.props["Glow Opacity"], comp, "Glow Opacity");
    addEGP(ctl.props["Glow Softness"], comp, "Glow Softness");
    addEGP(ctl.props["Pulse Speed"], comp, "Pulse Speed");
    addEGP(ctl.props["Rotation"], comp, "Rotation");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Glow Color");
    return comp;
}

function buildGlowPointNode() {
    var comp = makeComp("HI_Glow_Point_Node", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Point Pos X", value: 540 },
        { type: "slider", name: "Point Pos Y", value: 960 },
        { type: "slider", name: "Point Size", value: 100 },
        { type: "slider", name: "Glow Opacity", value: 85 },
        { type: "slider", name: "Glow Softness", value: 60 },
        { type: "slider", name: "Pulse Speed", value: 0.7 },
        { type: "slider", name: "Pulse Amount", value: 8 },
        { type: "slider", name: "Fade In", value: 0.25 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var halo = comp.layers.addShape();
    halo.name = "Halo";
    var haloShape = addEllipseShape(halo, "Halo", [180, 180], ORANGE, ORANGE, 0, 40, 0);
    addBlur(halo, 45);
    halo.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Point Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Point Pos Y')('Slider')]";
    halo.property("ADBE Transform Group").property("ADBE Scale").expression = pulseScaleExpr("Point Size", "Pulse Amount", "Pulse Speed");
    halo.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    haloShape.fill.property("ADBE Vector Fill Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";
    haloShape.fill.property("ADBE Vector Fill Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Glow Opacity')('Slider')";

    var dot = comp.layers.addShape();
    dot.name = "Dot";
    var dotShape = addEllipseShape(dot, "Dot", [26, 26], WARM_WHITE, ORANGE, 2, 100, 100);
    dot.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Point Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Point Pos Y')('Slider')]";
    dot.property("ADBE Transform Group").property("ADBE Scale").expression = pulseScaleExpr("Point Size", "Pulse Amount", "Pulse Speed");
    dot.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    dotShape.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    addEGP(ctl.props["Point Pos X"], comp, "Point Pos X");
    addEGP(ctl.props["Point Pos Y"], comp, "Point Pos Y");
    addEGP(ctl.props["Point Size"], comp, "Glow Size");
    addEGP(ctl.props["Glow Opacity"], comp, "Glow Opacity");
    addEGP(ctl.props["Glow Softness"], comp, "Glow Softness");
    addEGP(ctl.props["Pulse Speed"], comp, "Pulse Speed");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Glow Color");
    return comp;
}

function buildCalloutLine() {
    var comp = makeComp("HI_Callout_Line", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Line Pos X", value: 540 },
        { type: "slider", name: "Line Pos Y", value: 960 },
        { type: "slider", name: "Line Length", value: 260 },
        { type: "slider", name: "Line Angle", value: -35 },
        { type: "slider", name: "Line Thickness", value: 4 },
        { type: "slider", name: "Line Opacity", value: 100 },
        { type: "slider", name: "Fade In", value: 0.25 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var line = comp.layers.addShape();
    line.name = "Connector";
    var l = addLineShape(line);
    line.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Line Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Line Pos Y')('Slider')]";
    line.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    l.path.property("ADBE Vector Shape").expression = [
        "ctrl=thisComp.layer('CONTROLS');",
        "len=ctrl.effect('Line Length')('Slider');",
        "ang=degreesToRadians(ctrl.effect('Line Angle')('Slider'));",
        "pts=[[0,0],[Math.cos(ang)*len,Math.sin(ang)*len]];",
        "createPath(pts,[],[],false);"
    ].join("\n");
    l.stroke.property("ADBE Vector Stroke Width").expression =
        "thisComp.layer('CONTROLS').effect('Line Thickness')('Slider')";
    l.stroke.property("ADBE Vector Stroke Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Line Opacity')('Slider')";
    l.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    addEGP(ctl.props["Line Pos X"], comp, "Line Pos X");
    addEGP(ctl.props["Line Pos Y"], comp, "Line Pos Y");
    addEGP(ctl.props["Line Length"], comp, "Line Length");
    addEGP(ctl.props["Line Angle"], comp, "Line Angle");
    addEGP(ctl.props["Line Thickness"], comp, "Line Thickness");
    addEGP(ctl.props["Line Opacity"], comp, "Line Opacity");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Line Color");
    return comp;
}

function buildCaptionCallout() {
    var comp = makeComp("HI_Caption_Callout", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Caption Pos X", value: 780 },
        { type: "slider", name: "Caption Pos Y", value: 700 },
        { type: "slider", name: "Caption Scale", value: 100 },
        { type: "slider", name: "Caption Rotation", value: 0 },
        { type: "slider", name: "Fade In", value: 0.3 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var box = comp.layers.addShape();
    box.name = "Caption Box";
    var rect = addRectShape(box, "Box", [420, 170], 40, CHARCOAL, ORANGE, 4, 65, 100);
    box.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    box.property("ADBE Transform Group").property("ADBE Scale").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Scale')('Slider'),thisComp.layer('CONTROLS').effect('Caption Scale')('Slider')]";
    box.property("ADBE Transform Group").property("ADBE Rotation").expression =
        "thisComp.layer('CONTROLS').effect('Caption Rotation')('Slider')";
    box.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    rect.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    var text = comp.layers.addText("Lengthen spine");
    text.name = "Caption Text";
    setTextStyle(text, "Lengthen spine", 52, WARM_WHITE, ParagraphJustification.CENTER_JUSTIFY);
    text.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Scale").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Scale')('Slider'),thisComp.layer('CONTROLS').effect('Caption Scale')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Rotation").expression =
        "thisComp.layer('CONTROLS').effect('Caption Rotation')('Slider')";
    text.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();

    addEGP(text.property("Source Text"), comp, "Caption Text");
    addEGP(ctl.props["Caption Pos X"], comp, "Caption Pos X");
    addEGP(ctl.props["Caption Pos Y"], comp, "Caption Pos Y");
    addEGP(ctl.props["Caption Scale"], comp, "Scale");
    addEGP(ctl.props["Caption Rotation"], comp, "Rotation");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Accent Color");
    return comp;
}

function buildBreathPulse() {
    var comp = makeComp("HI_Breath_Pulse", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Pulse Pos X", value: 320 },
        { type: "slider", name: "Pulse Pos Y", value: 900 },
        { type: "slider", name: "Pulse Size", value: 100 },
        { type: "slider", name: "Pulse Opacity", value: 70 },
        { type: "slider", name: "Pulse Speed", value: 0.5 },
        { type: "slider", name: "Pulse Amount", value: 10 },
        { type: "slider", name: "Fade In", value: 0.25 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    function addRing(name, sizePx, opacityPx) {
        var layer = comp.layers.addShape();
        layer.name = name;
        var ring = addEllipseShape(layer, name, [sizePx, sizePx], [0,0,0], ORANGE, 4, 0, opacityPx);
        layer.property("ADBE Transform Group").property("ADBE Position").expression =
            "[thisComp.layer('CONTROLS').effect('Pulse Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Pulse Pos Y')('Slider')]";
        layer.property("ADBE Transform Group").property("ADBE Scale").expression = pulseScaleExpr("Pulse Size", "Pulse Amount", "Pulse Speed");
        layer.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
        ring.stroke.property("ADBE Vector Stroke Color").expression =
            "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";
        return layer;
    }

    addRing("Ring 1", 170, 100);
    addRing("Ring 2", 250, 55);
    addRing("Ring 3", 340, 25);

    var text = comp.layers.addText("Exhale");
    text.name = "Breath Text";
    setTextStyle(text, "Exhale", 46, WARM_WHITE, ParagraphJustification.CENTER_JUSTIFY);
    text.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Pulse Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Pulse Pos Y')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();

    addEGP(text.property("Source Text"), comp, "Caption Text");
    addEGP(ctl.props["Pulse Pos X"], comp, "Caption Pos X");
    addEGP(ctl.props["Pulse Pos Y"], comp, "Caption Pos Y");
    addEGP(ctl.props["Pulse Size"], comp, "Glow Size");
    addEGP(ctl.props["Pulse Opacity"], comp, "Glow Opacity");
    addEGP(ctl.props["Pulse Speed"], comp, "Pulse Speed");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Glow Color");
    return comp;
}

function buildSaveCTA() {
    var comp = makeComp("HI_Save_CTA", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Caption Pos X", value: 540 },
        { type: "slider", name: "Caption Pos Y", value: 960 },
        { type: "slider", name: "Scale", value: 100 },
        { type: "slider", name: "Rotation", value: 0 },
        { type: "slider", name: "Fade In", value: 0.3 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var bar = comp.layers.addShape();
    bar.name = "Accent Bar";
    var rect = addRectShape(bar, "Bar", [8, 420], 4, ORANGE, ORANGE, 0, 100, 0);
    bar.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider')-220, thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    bar.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();

    var text = comp.layers.addText("Save this for your next practice");
    text.name = "CTA Text";
    setTextStyle(text, "Save this for your next practice", 66, WARM_WHITE, ParagraphJustification.LEFT_JUSTIFY);
    text.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider')+40, thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Scale").expression =
        "[thisComp.layer('CONTROLS').effect('Scale')('Slider'),thisComp.layer('CONTROLS').effect('Scale')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Rotation").expression =
        "thisComp.layer('CONTROLS').effect('Rotation')('Slider')";
    text.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();

    addEGP(text.property("Source Text"), comp, "Caption Text");
    addEGP(ctl.props["Caption Pos X"], comp, "Caption Pos X");
    addEGP(ctl.props["Caption Pos Y"], comp, "Caption Pos Y");
    addEGP(ctl.props["Scale"], comp, "Scale");
    addEGP(ctl.props["Rotation"], comp, "Rotation");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Accent Color");
    return comp;
}

function buildFullCueCombo() {
    var comp = makeComp("HI_Full_Cue_Combo", 5);
    var ctl = makeControls(comp, [
        { type: "slider", name: "Point Pos X", value: 420 },
        { type: "slider", name: "Point Pos Y", value: 1120 },
        { type: "slider", name: "Caption Pos X", value: 760 },
        { type: "slider", name: "Caption Pos Y", value: 760 },
        { type: "slider", name: "Glow Size", value: 100 },
        { type: "slider", name: "Glow Opacity", value: 80 },
        { type: "slider", name: "Line Length", value: 220 },
        { type: "slider", name: "Line Angle", value: -45 },
        { type: "slider", name: "Line Opacity", value: 100 },
        { type: "slider", name: "Pulse Speed", value: 0.5 },
        { type: "slider", name: "Pulse Amount", value: 6 },
        { type: "slider", name: "Fade In", value: 0.25 },
        { type: "slider", name: "Hold", value: 3.5 },
        { type: "slider", name: "Fade Out", value: 0.45 },
        { type: "color", name: "Glow Color", value: ORANGE }
    ]);

    var halo = comp.layers.addShape();
    halo.name = "Combo Halo";
    var haloShape = addEllipseShape(halo, "Halo", [180, 180], ORANGE, ORANGE, 0, 40, 0);
    addBlur(halo, 45);
    halo.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Point Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Point Pos Y')('Slider')]";
    halo.property("ADBE Transform Group").property("ADBE Scale").expression = pulseScaleExpr("Glow Size", "Pulse Amount", "Pulse Speed");
    halo.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    haloShape.fill.property("ADBE Vector Fill Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";
    haloShape.fill.property("ADBE Vector Fill Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Glow Opacity')('Slider')";

    var dot = comp.layers.addShape();
    dot.name = "Combo Dot";
    var dotShape = addEllipseShape(dot, "Dot", [24, 24], WARM_WHITE, ORANGE, 2, 100, 100);
    dot.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Point Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Point Pos Y')('Slider')]";
    dot.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    dotShape.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    var line = comp.layers.addShape();
    line.name = "Combo Line";
    var l = addLineShape(line);
    line.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Point Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Point Pos Y')('Slider')]";
    line.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    l.path.property("ADBE Vector Shape").expression = [
        "ctrl=thisComp.layer('CONTROLS');",
        "len=ctrl.effect('Line Length')('Slider');",
        "ang=degreesToRadians(ctrl.effect('Line Angle')('Slider'));",
        "pts=[[0,0],[Math.cos(ang)*len,Math.sin(ang)*len]];",
        "createPath(pts,[],[],false);"
    ].join("\n");
    l.stroke.property("ADBE Vector Stroke Opacity").expression =
        "thisComp.layer('CONTROLS').effect('Line Opacity')('Slider')";
    l.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    var box = comp.layers.addShape();
    box.name = "Combo Box";
    var rect = addRectShape(box, "Box", [360, 150], 36, CHARCOAL, ORANGE, 4, 65, 100);
    box.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    box.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();
    rect.stroke.property("ADBE Vector Stroke Color").expression =
        "thisComp.layer('CONTROLS').effect('Glow Color')('Color')";

    var text = comp.layers.addText("Root through palms");
    text.name = "Combo Text";
    setTextStyle(text, "Root through palms", 46, WARM_WHITE, ParagraphJustification.CENTER_JUSTIFY);
    text.property("ADBE Transform Group").property("ADBE Position").expression =
        "[thisComp.layer('CONTROLS').effect('Caption Pos X')('Slider'), thisComp.layer('CONTROLS').effect('Caption Pos Y')('Slider')]";
    text.property("ADBE Transform Group").property("ADBE Opacity").expression = fadeExpr();

    addEGP(text.property("Source Text"), comp, "Caption Text");
    addEGP(ctl.props["Point Pos X"], comp, "Point Pos X");
    addEGP(ctl.props["Point Pos Y"], comp, "Point Pos Y");
    addEGP(ctl.props["Caption Pos X"], comp, "Caption Pos X");
    addEGP(ctl.props["Caption Pos Y"], comp, "Caption Pos Y");
    addEGP(ctl.props["Glow Size"], comp, "Glow Size");
    addEGP(ctl.props["Glow Opacity"], comp, "Glow Opacity");
    addEGP(ctl.props["Line Length"], comp, "Line Length");
    addEGP(ctl.props["Line Angle"], comp, "Line Angle");
    addEGP(ctl.props["Line Opacity"], comp, "Line Opacity");
    addEGP(ctl.props["Pulse Speed"], comp, "Pulse Speed");
    addEGP(ctl.props["Fade In"], comp, "Start Fade");
    addEGP(ctl.props["Fade Out"], comp, "End Fade");
    addEGP(ctl.props["Glow Color"], comp, "Glow Color");
    return comp;
}

function buildDemoComp(assets) {
    var comp = makeComp("DEMO__DOWNWARD_DOG_60S", 60);
    var times = [
        [0, 5, "Root through palms"],
        [5, 10, "Press evenly through hands"],
        [10, 15, "Engage arms"],
        [15, 20, "Lengthen spine"],
        [20, 25, "Lift hips up and back"],
        [25, 30, "Soften knees"],
        [30, 35, "Reach heels down"],
        [35, 40, "Relax neck"],
        [40, 45, "Breathe out"],
        [45, 50, "Whole body connection"],
        [50, 55, "Stay for 5 breaths"],
        [55, 60, "Save this for your next practice"]
    ];

    for (var i = 0; i < times.length; i++) {
        var seg = times[i];
        var source = (i === 8 || i === 10) ? assets.breath : (i === 11 ? assets.cta : assets.combo);
        var layer = comp.layers.add(source);
        layer.startTime = seg[0];
        layer.inPoint = seg[0];
        layer.outPoint = seg[1];
        layer.name = "Cue " + (i + 1) + " - " + seg[2];
    }
    return comp;
}

try {
    ensureFolder(ROOT);
    ensureFolder(MOGRT_DIR);
    ensureFolder(ROOT + "/Source_Project");
    ensureFolder(ROOT + "/Documentation");
    ensureFolder(ROOT + "/Demo_Timeline");

    var resetLog = new File(LOG_PATH);
    if (resetLog.exists) resetLog.remove();
    logLine("Starting real yoga MOGRT export");

    app.newProject();
    logLine("Created new AE project");

    var comps = {};
    comps.glow = buildBodyGlowSweep();
    logLine("Built comp: " + comps.glow.name);
    comps.point = buildGlowPointNode();
    logLine("Built comp: " + comps.point.name);
    comps.line = buildCalloutLine();
    logLine("Built comp: " + comps.line.name);
    comps.caption = buildCaptionCallout();
    logLine("Built comp: " + comps.caption.name);
    comps.breath = buildBreathPulse();
    logLine("Built comp: " + comps.breath.name);
    comps.cta = buildSaveCTA();
    logLine("Built comp: " + comps.cta.name);
    comps.combo = buildFullCueCombo();
    logLine("Built comp: " + comps.combo.name);
    var demo = buildDemoComp(comps);
    logLine("Built comp: " + demo.name);

    app.project.save(new File(PROJECT_PATH));
    logLine("Saved project: " + PROJECT_PATH);

    exportComp(comps.glow);
    exportComp(comps.point);
    exportComp(comps.line);
    exportComp(comps.caption);
    exportComp(comps.breath);
    exportComp(comps.cta);
    exportComp(comps.combo);

    app.project.save(new File(PROJECT_PATH));
    logLine("Saved project after exports");
    app.endUndoGroup();
    logLine("Completed export successfully");
    alert("Exported real yoga MOGRTs to " + MOGRT_DIR);
} catch (err) {
    logLine("FATAL: " + err.toString());
    try {
        if (err.line !== undefined) logLine("FATAL LINE: " + err.line);
    } catch (lineErr) {}
    app.endUndoGroup();
    throw err;
}
