Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

pidFile = "F:\工程\claudecodeui\.server-pid"

' 先杀 node.exe 进程树(只杀3001端口的)
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -ano ^| findstr :5173.*LISTENING') do taskkill /f /pid %a /t", 0, True
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -ano ^| findstr :3001.*LISTENING') do taskkill /f /pid %a /t", 0, True

MsgBox "CloudCLI 已关闭", 64, "CloudCLI"
