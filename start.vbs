Set WshShell = CreateObject("WScript.Shell")

' 启动服务器（隐藏窗口）
WshShell.Run "cmd /c ""F:\工程\claudecodeui\start.bat""", 0, False

' 等待2秒后打开浏览器
WScript.Sleep 2000
WshShell.Run "http://localhost:3001"
