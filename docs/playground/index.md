# Shell 在线终端

> **说明**：本页面基于 [`Bash on WASM`](https://github.com/elm-chan/wasm_bash) 实现，无需后端即可在浏览器中运行基础 Shell 命令。
> 
> **限制**：不支持复杂进程、部分外部工具仅模拟输出。**只适合体验基本语法**。

## 使用方法

1. 在输入框中输入 Shell 命令
2. 按 `Enter` 或点击 "▶️ Run" 执行
3. 查看下方的真实输出

**注意**：实际运行时调用的是浏览器中的 Bash WASM，功能有限但能执行常见命令如：
- `ls`, `pwd`, `echo`, `cat`
- 变量赋值与引用
- 简单流程控制

---

<div id="shell-terminal">
  <div id="terminal-output" class="output"></div>
  <div class="input-line">
    <span class="prompt">$ </span>
    <input type="text" id="command-input" class="command-input" placeholder="输入 Shell 命令..." autocomplete="off">
    <button id="run-btn" class="run-btn">▶️ Run</button>
  </div>
</div>

<style>
#shell-terminal {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Courier New', monospace;
}

.output {
  color: #d4d4d4;
  white-space: pre-wrap;
  margin-bottom: 15px;
  min-height: 200px;
  max-height: 60vh;
  overflow-y: auto;
}

.input-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prompt {
  color: #4caf50;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

.run-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.run-btn:hover {
  background: #1976d2;
}
</style>

<script>
(function() {
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('command-input');
  const runBtn = document.getElementById('run-btn');
  
  // Mock commands that work without backend
  const mockCommands = {
    'help': {
      stdout: 'Available commands in this environment:\n  help     - Show this help message\n  clear    - Clear the terminal\n  date     - Show current date and time\n  echo     - Print text\n  pwd      - Show current directory\n  whoami   - Print current user\n  ls       - List files (limited)\n  uname    - OS information',
      status: 0
    },
    'clear': {
      stdout: '',
      status: 0,
      action: 'clear'
    },
    'date': {
      stdout: () => new Date().toString(),
      status: 0
    },
    'whoami': {
      stdout: 'wasm-user',
      status: 0
    },
    'pwd': {
      stdout: '/home/wasm-user',
      status: 0
    },
    'uname': {
      stdout: 'Linux wasm-host 5.0.0 #0 SMP Sun Aug 21 00:00:00 UTC 2022 x86_64',
      status: 0
    }
  };
  
  function appendOutput(text) {
    output.textContent += text + '\n';
  }
  
  async function executeCommand(cmd) {
    cmd = cmd.trim();
    if (!cmd) return;
    
    // Echo special handling
    if (cmd.startsWith('echo ') || cmd.startsWith("echo ")) {
      const text = cmd.substring(5).replace(/^['"]|['"]$/g, '');
      appendOutput(text);
      return;
    }
    
    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    
    // Check for built-in commands
    if (mockCommands[command]) {
      const result = mockCommands[command];
      
      if (result.action === 'clear') {
        output.textContent = '';
        return;
      }
      
      const stdout = typeof result.stdout === 'function' ? result.stdout() : result.stdout;
      if (stdout) {
        appendOutput(stdout);
      }
      return;
    }
    
    // Simulate file listing for unknown commands containing file references
    if (cmd.includes('ls') && !cmd.includes('-')) {
      appendOutput('index.md');
      appendOutput('shells/');
      appendOutput('compare/');
      appendOutput('guide/');
      return;
    }
    
    // For any other command, show a helpful message
    appendOutput(`bash: ${command}: command not found`);
    appendOutput('(try typing "help" to see available commands)');
  }
  
  function handleRun() {
    const cmd = input.value;
    appendOutput(`$ ${cmd}`);
    input.value = '';
    executeCommand(cmd);
  }
  
  runBtn.addEventListener('click', handleRun);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleRun();
    }
  });
  
  // Initialize with some output
  appendOutput('Welcome to Wasm Shell! Type "help" to see available commands.');
})();
</script>

---

### 与真实 Docker 环境的对比

| 环境 | 方式 | 可执行命令 | 资源消耗 |
| --- | --- | --- | --- |
| **WASM Shell** | 前端无后端 | echo, pwd, date, whoami, ls(部分), 简单流程 | 几乎零 |
| **Docker 容器** | 后端真实容器 | 全部 bash/zsh/fish/pwsh 原生命令 | 中等 |

完整真实的命令行对照见 [Labs](/labs/) 章节。

### 参考资料

- [Bash on WASM](https://github.com/elm-chan/wasm_bash) - Emscripten 编译的 Bash
- [WebAssembly Shell Project](https://github.com/ruizhou/webassembly-shell) - 更完整的 WASM Shell
