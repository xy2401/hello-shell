# Bash：公共 Docker 采集试点

状态：**待首次 Actions 验证**。此页不替代[原有 Docker 证据](./DockerTooling)。

## 场景与边界

使用 `.env.versions` 的 Bash 5.2 镜像锁，只读挂载 `demos/bash/00_env.sh`。检查真实 Bash 版本、Shell 名称和 Linux 平台。其他八项任务及 Windows 原生输出仍由原采集流程维护。

## 本地查看计划

```powershell
npm run docker:check
npm run docker:plan -- --shell powershell
```

先获取独立的 [hello-docker 工具仓库](https://github.com/xy2401/hello-docker/tree/codex/hello-docker)，将 `HELLO_DOCKER_HOME` 设置为该仓库的绝对路径，再在 hello-shell 仓库根目录执行以上命令。这两个入口只检查配置和生成计划。

## Actions 执行与回写

发布公共工具后，在 `collect-docker-pilot.yml` 手动输入其完整 40 位提交 SHA。工作流执行容器、检查三项断言、上传日志，并在成功后回写 `demos/bash/docker-pilot/` 与本页。

普通代码推送不会触发容器采集。原始失败日志保留为 Artifact，失败结果不会替换本页。
