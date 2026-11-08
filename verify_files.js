var fso = new ActiveXObject('Scripting.FileSystemObject');
function check(path) {
  try {
    var f = fso.OpenTextFile(path, 1);
    var content = f.ReadAll();
    f.Close();
    WScript.Echo(path + ' OK - Length: ' + content.length);
  } catch(e) {
    WScript.Echo(path + ' ERROR: ' + e.message);
  }
}
check('js\\data.js');
check('js\\sync.js');
check('js\\app.js');
check('js\\duty_and_exam.js');
check('index.html');
check('css\\main.css');

