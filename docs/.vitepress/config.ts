import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'hello-shell',
  description:
    'Shell 与命令行统一任务矩阵：bash/zsh/fish/cmd/PowerShell 同任务对照与真实输出快照 (Shell & Command Line Task Matrix)',
  lang: 'zh-CN',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '基础原理', link: '/fundamentals/' },
      { text: 'Shell 分卷', link: '/shells/bash/' },
      { text: '矩阵', link: '/matrix/' },
      { text: '对比', link: '/compare/shell-vs-python' },
      { text: '实验', link: '/labs/' },
      { text: '参考', link: '/reference/version-policy' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '内核、Shell、GUI：三层概念', link: '/guide/kernel-shell-gui' },
            { text: '快速上手', link: '/guide/getting-started' },
          ],
        },
      ],
      '/fundamentals/': [
        {
          text: '基础原理',
          items: [
            { text: '总览', link: '/fundamentals/' },
            { text: '变量与引号', link: '/fundamentals/quoting-variables' },
            { text: '控制流', link: '/fundamentals/control-flow' },
            { text: '函数与管道', link: '/fundamentals/functions-pipes' },
            { text: '错误与信号', link: '/fundamentals/errors-signals' },
          ],
        },
      ],
      '/shells/': [
        {
          text: 'bash',
          items: [
            { text: 'bash 总览', link: '/shells/bash/' },
            { text: 'bash 语法', link: '/shells/bash/syntax' },
            { text: 'bash 入参', link: '/shells/bash/args' },
            { text: 'bash 坑位', link: '/shells/bash/pitfalls' },
          ],
        },
        {
          text: 'zsh',
          items: [
            { text: 'zsh 总览', link: '/shells/zsh/' },
            { text: 'zsh 语法', link: '/shells/zsh/syntax' },
            { text: 'zsh 入参', link: '/shells/zsh/args' },
            { text: 'zsh 坑位', link: '/shells/zsh/pitfalls' },
          ],
        },
        {
          text: 'fish',
          items: [
            { text: 'fish 总览', link: '/shells/fish/' },
            { text: 'fish 语法', link: '/shells/fish/syntax' },
            { text: 'fish 入参', link: '/shells/fish/args' },
            { text: 'fish 坑位', link: '/shells/fish/pitfalls' },
          ],
        },
        {
          text: 'cmd',
          items: [
            { text: 'cmd 总览', link: '/shells/cmd/' },
            { text: 'cmd 语法', link: '/shells/cmd/syntax' },
            { text: 'cmd 入参', link: '/shells/cmd/args' },
            { text: 'cmd 坑位', link: '/shells/cmd/pitfalls' },
          ],
        },
        {
          text: 'powershell',
          items: [
            { text: 'PowerShell 总览', link: '/shells/powershell/' },
            { text: 'PowerShell 语法', link: '/shells/powershell/syntax' },
            { text: 'PowerShell 入参', link: '/shells/powershell/args' },
            { text: 'PowerShell 坑位', link: '/shells/powershell/pitfalls' },
          ],
        },
      ],
      '/compare/': [
        {
          text: '对比',
          items: [{ text: 'Shell vs Python', link: '/compare/shell-vs-python' }],
        },
      ],
      '/matrix/': [
        {
          text: '矩阵',
          items: [
            { text: '矩阵总览', link: '/matrix/' },
            { text: '入参矩阵', link: '/matrix/args-matrix' },
            { text: '引号矩阵', link: '/matrix/quoting-matrix' },
            { text: '通配矩阵', link: '/matrix/globbing-matrix' },
            { text: '错误处理矩阵', link: '/matrix/error-handling-matrix' },
            { text: '可移植性矩阵', link: '/matrix/portability-matrix' },
          ],
        },
      ],
      '/labs/': [
        {
          text: '实验',
          items: [{ text: '实验总览', link: '/labs/' }],
        },
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '版本政策', link: '/reference/version-policy' },
            { text: '证据政策', link: '/reference/evidence-policy' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'MIT License',
    },
  },
})
