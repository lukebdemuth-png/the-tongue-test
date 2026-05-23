/*
  02_create_comp.jsx
*/

(function createCompTest() {
    if (!app.project) {
        app.newProject();
    }

    app.beginUndoGroup("AE Create Comp Test");

    var comp = app.project.items.addComp("TEST__CREATE_COMP", 1080, 1920, 1, 5, 30);
    comp.openInViewer();
    alert("02 create comp test ran");

    app.endUndoGroup();
}());
