/*
  04_shape_and_null.jsx
*/

(function shapeAndNullTest() {
    if (!app.project) {
        app.newProject();
    }

    app.beginUndoGroup("AE Shape And Null Test");

    var comp = app.project.items.addComp("TEST__SHAPE_AND_NULL", 1080, 1920, 1, 5, 30);

    var guideNull = comp.layers.addNull();
    guideNull.name = "TEST_CTRL";
    guideNull.property("Transform").property("Position").setValue([540, 960]);

    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "TEST_GLOW_SHAPE";

    var contents = shapeLayer.property("Contents");
    var group = contents.addProperty("ADBE Vector Group");
    var inner = group.property("Contents");
    var ellipse = inner.addProperty("ADBE Vector Shape - Ellipse");
    ellipse.property("Size").setValue([180, 120]);

    var fill = inner.addProperty("ADBE Vector Graphic - Fill");
    fill.property("Color").setValue([0.8118, 0.4353, 0.1020]);
    fill.property("Opacity").setValue(40);

    shapeLayer.property("Transform").property("Position").setValue([540, 960]);

    comp.openInViewer();
    alert("04 shape and null test ran");

    app.endUndoGroup();
}());
