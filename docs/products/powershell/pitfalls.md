# PowerShell 常见陷阱

> 本页结论：四个高频坑——PS5.1 的默认输出编码与 BOM 会把文件变成 UTF-16/乱码；布尔值打印成 `True` 而不是 `true`；cmdlet 失败不设置 `$LASTEXITCODE`，成败要问 `$?` 或 try/catch；路径分隔符跨平台必须走 `Join-Path`。

## 陷阱一：PS5 默认输出编码与 BOM

两代 PowerShell 的默认编码完全不同：

| 行为 | PS5.1 | PS7 |
| --- | --- | --- |
| `>` / `Out-File` 默认 | UTF-16LE（带 BOM） | UTF-8（无 BOM） |
| 管道给外部程序的文本 | OEM/ANSI 代码页 | UTF-8 |
| 读无 BOM 文件 | 按 ANSI 代码页猜 | 按 UTF-8 |

后果：PS5 上 `script.ps1 > out.txt` 生成的文件，Linux 工具一读就是
"U\0T\0F\0…" 式的 UTF-16 字节流；非 ASCII 输出经管道给外部命令还可能
撞代码页乱码。PS7 统一为 UTF-8 无 BOM，跨平台脚本才真正省心。
这也是本仓库 Windows 采集器显式用 ASCII 编码写 `*.out.txt` 的原因
（见 `scripts/collect-windows.ps1`），避免编码差异污染快照对比。

> Windows 快照已采集入库（`demos/powershell5/`、`demos/powershell7/`
> 各 9 份）：02～08 七个任务两代输出逐行一致，证实基础行为无分叉。
> 编码默认值本身属两代官方行为差异，demo 输出均为纯 ASCII 且经采集器
> 统一以 ASCII 写盘（见 `scripts/collect-windows.ps1`），快照中不会
> 直接呈现 UTF-16/代码页差异。

## 陷阱二：布尔输出 True vs true

PowerShell 把 `$true` 格式化成首字母大写的 `True`，而 bash/fish/python
的惯例是小写 `true`。直接插值会造成快照口径不一致：

```powershell
$verboseFlag = $true
Write-Output "verboseFlag=$verboseFlag"          # verboseFlag=True —— 首字母大写
```

本仓库 demo 统一压成小写再输出（摘自
`demos/powershell7/03_args_parsing.ps1`）：

```powershell
Write-Output "verboseFlag=$($verboseFlag.ToString().ToLower())"
```

对照 `demos/pwsh/03_args_parsing.ps1.out.txt` 中的 `verboseFlag=true`，
与 bash/zsh/fish/cmd/python 各版口径一致；Windows 侧两代快照同为
`verboseFlag=true`（`demos/powershell5/03_args_parsing.ps1.out.txt`
第 5 行），证明 `.ToLower()` 归一在 PS5.1 上同样有效。cmd 侧没有布尔
类型，直接用字符串 `true`/`false` 变量，反而没有这个问题。

## 陷阱三：cmdlet 失败不设置 $LASTEXITCODE

`$LASTEXITCODE` 只由**原生子进程**（.exe / 外部命令）写入；cmdlet 失败
根本不动它：

```powershell
Get-Content '/nonexistent'      # 报错，但 $LASTEXITCODE 仍为上一次的残留值
```

判断 cmdlet 成败的三个正确手段：

1. `$?`：上一条命令是否成功（布尔）；
2. try/catch + `-ErrorAction Stop`：把错误升级为终止性后捕获；
3. 起子进程承载退出码，再读 `$LASTEXITCODE`——demo 的 07 任务就是这么
   做的（摘自 `demos/powershell7/07_errors.ps1`）：

```powershell
& pwsh -NoProfile -Command '$ErrorActionPreference=''Stop''; Get-Content -Path /nonexistent-hello-shell | Out-Null' > $null 2> $null
Write-Output "setEExitCode=$LASTEXITCODE"
```

实测 `demos/pwsh/07_errors.ps1.out.txt`：`setEExitCode=1`；Windows 侧
两代快照逐行相同（`demos/powershell5/07_errors.ps1.out.txt` 与
`demos/powershell7/07_errors.ps1.out.txt` 第 3 行均为 `setEExitCode=1`）。
同理 05 任务的「返回 7」也是子 pwsh `exit 7` 实现的——函数本身无法
交出退出码，Windows 快照同为 `exitCodeReturn=7`（05 快照第 2 行）。
各 shell 的失败信号对照见
[错误处理矩阵](/matrix/error-handling-matrix)。

## 陷阱四：路径分隔符跨平台用 Join-Path

Windows 是 `\`，Linux/macOS 是 `/`；PS5 只存在于 Windows 所以旧脚本
常硬编码 `\`，一上 PS7 跨平台就断。正确姿势是永不手拼分隔符：

```powershell
$fixtures = $env:HELLO_SHELL_FIXTURES
Import-Csv (Join-Path $fixtures 'orders.csv')     # 两平台都对
```

环境变量风格也不同：Windows 的 `%TEMP%` 对应 PowerShell 的 `$env:TEMP`，
Linux 上则没有 `TEMP`。demo 的 08 任务用 `$IsWindows` 双分支处理
（摘自 `demos/powershell7/08_real_world.ps1`）：

```powershell
$work = if ($IsWindows) { Join-Path $env:TEMP 'hello-shell-work' } else { '/tmp/work' }
```

实测 `demos/pwsh/08_real_world.ps1.out.txt`（Linux 分支）：

```text
prepared=3
renamed=1
unchanged=2
verify=ok
report=prepared=3,renamed=1,unchanged=2
```

Windows 分支同样通过实测：`demos/powershell7/08_real_world.ps1.out.txt`
（走 `$env:TEMP` 路径）输出与上面逐行相同，`verify=ok`（第 4 行）；
PS5.1 的同名快照亦然。

顺带一提：PS7 里多数 cmdlet 的路径参数其实正斜杠也能收，但
`.NET API`（`[System.IO.File]::…`）与原生命令不一定，统一 `Join-Path`
是唯一无脑安全的写法。

## 小结

| 陷阱 | 一句话对策 |
| --- | --- |
| PS5 编码/BOM | 跨平台一律上 PS7；PS5 场景显式 `-Encoding utf8` |
| `True` vs `true` | 输出前 `.ToString().ToLower()` 统一口径 |
| `$LASTEXITCODE` 不反映 cmdlet | 用 `$?` / try/catch，或子进程承载退出码 |
| 路径分隔符 | `Join-Path` + `$IsWindows` 分支，禁手拼 `\` |

更多语法背景见 [语法基础](/products/powershell/syntax)，动手复现见
[统一任务实验](/matrix/experiments)。
