var f = new File("/private/tmp/ae_doscript_test_output.txt");
if (f.open("w")) {
    f.write("OK");
    f.close();
}
