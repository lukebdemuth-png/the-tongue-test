/*
  03_create_text.jsx
*/

(function createTextTest() {
    if (!app.project) {
        app.newProject();
    }

    app.beginUndoGroup("AE Create Text Test");

    var comp = app.project.items.addComp("TEST__CREATE_TEXT", 1080, 1920, 1, 5, 30);
    var textLayer = comp.layers.addText("AE text layer test");
    var textDoc = textLayer.property("Source Text").value;
    textDoc.text = "AE text layer test";
    textDoc.fontSize = 64;
    textLayer.property("Source Text").setValue(textDoc);
    textLayer.property("Transform").property("Position").setValue([540, 960]);
    comp.openInViewer();
    alert("03 create text test ran");

    app.endUndoGroup();
}());
