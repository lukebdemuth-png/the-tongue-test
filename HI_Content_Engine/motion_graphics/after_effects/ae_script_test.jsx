/*
  ae_script_test.jsx
  Tiny After Effects sanity check.
*/

(function aeScriptTest() {
    app.beginUndoGroup("AE Script Test");
    alert("After Effects script execution is working.");
    app.endUndoGroup();
}());
