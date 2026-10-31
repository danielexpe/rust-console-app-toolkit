import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "node:fs"
import path from "node:path"

const KIT_ROOT = path.resolve(import.meta.dir, "..", "..")
const SKILL_DIR = path.join(
  KIT_ROOT,
  ".opencode",
  "skills",
  "rust-console-tui-framebuffer",
)
const SCAFFOLD_DIR = path.join(SKILL_DIR, "assets", "scaffold")
const FRAMEWORK = path.join(
  KIT_ROOT,
  "framework_app_rust_console_linux_TUI_framebuffer.md",
)

const TEXT_FILE = /\.(md|toml|rs|sh|txt|json)$/

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function render(text: string, vars: Record<string, string>): string {
  return text.replace(/__([A-Z_]+)__/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  )
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function copyTree(
  source: string,
  destination: string,
  vars: Record<string, string>,
  force: boolean,
  created: string[],
): Promise<void> {
  const entries = await fs.readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(source, entry.name)
    const name = entry.name.endsWith(".template")
      ? entry.name.slice(0, -".template".length)
      : entry.name
    const to = path.join(destination, name)

    if (entry.isDirectory()) {
      await copyTree(from, to, vars, force, created)
      continue
    }
    if (!force && (await exists(to))) continue

    const data = await fs.readFile(from)
    const shouldRender = name === ".gitignore" || TEXT_FILE.test(name)
    const output = shouldRender
      ? new TextEncoder().encode(render(data.toString("utf8"), vars))
      : data

    await fs.mkdir(path.dirname(to), { recursive: true })
    await fs.writeFile(to, output)
    created.push(to)
  }
}

function truncate(value: string, limit = 6000): string {
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}\n... (${value.length - limit} caracteres omitidos)`
}

type Captured = { code: number; output: string }

async function capture(promise: Promise<any>): Promise<Captured> {
  const result = await promise
  const stdout = result?.stdout?.toString?.() ?? ""
  const stderr = result?.stderr?.toString?.() ?? ""
  return {
    code: typeof result?.exitCode === "number" ? result.exitCode : 0,
    output: `${stdout}${stderr}`.trim(),
  }
}

async function readIfExists(target: string): Promise<string> {
  try {
    return (await fs.readFile(target, "utf8")).trim()
  } catch {
    return "(indisponível)"
  }
}

export const ConsoleAppPlugin = async ({ $ }) => {
  return {
    tool: {
      scaffold_console_app: tool({
        description:
          "Create a new Rust Linux console app skeleton (TUI + fbdev) from the " +
          "rust-console-tui-framebuffer skill templates: README, AGENTS.md, " +
          "docs/01-08, Cargo.toml, src/main.rs, install.sh, testes_debug.sh, " +
          "xtask and asset/test directories. Does not run git or cargo.",
        args: {
          target: tool.schema
            .string()
            .describe("Directory to create, relative to the project root"),
          name: tool.schema
            .string()
            .describe("Product display name, e.g. 'Minha Calculadora'"),
          bin: tool.schema
            .string()
            .optional()
            .describe("Binary/crate name (default: slug of name)"),
          description: tool.schema
            .string()
            .optional()
            .describe("One-line product description"),
          audio: tool.schema
            .boolean()
            .default(true)
            .describe("Enable the optional `audio` feature by default"),
          force: tool.schema
            .boolean()
            .default(false)
            .describe("Overwrite existing files"),
        },
        async execute(args, context) {
          const target = path.resolve(context.directory, args.target)
          const bin = (args.bin?.trim() || slugify(args.name)).trim()
          if (!bin) throw new Error("empty binary name")
          if (!(await exists(SCAFFOLD_DIR))) {
            throw new Error(`scaffold templates not found at ${SCAFFOLD_DIR}`)
          }

          if ((await exists(target)) && !args.force) {
            const entries = await fs.readdir(target)
            if (entries.length > 0) {
              throw new Error(
                `${target} is not empty; pass force=true to overwrite files`,
              )
            }
          }

          const vars: Record<string, string> = {
            APP: args.name.trim(),
            BIN: bin,
            DESCRIPTION:
              args.description?.trim() ||
              `${args.name.trim()} for the Linux console`,
            YEAR: String(new Date().getFullYear()),
            VERSION: "0.1.0",
            DEFAULT_FEATURES: args.audio ? '"audio"' : "",
          }

          await fs.mkdir(target, { recursive: true })
          const created: string[] = []
          await copyTree(SCAFFOLD_DIR, target, vars, args.force, created)

          for (const directory of [
            "assets/src",
            "assets/generated",
            "assets/fonts",
            "tests/snapshots",
          ]) {
            await fs.mkdir(path.join(target, directory), { recursive: true })
          }

          if (await exists(FRAMEWORK)) {
            const frameworkCopy = path.join(target, "framework.md")
            if (args.force || !(await exists(frameworkCopy))) {
              await fs.copyFile(FRAMEWORK, frameworkCopy)
              created.push(frameworkCopy)
            }
          }

          const relative = created
            .map((file) => path.relative(target, file))
            .sort()
          return {
            title: `Scaffold: ${args.name}`,
            output:
              `Created ${relative.length} files in ${target}\n\n` +
              "```text\n" +
              relative.join("\n") +
              "\n```\n\n" +
              "Próximos passos: preencha docs/01-08 e AGENTS.md, congele o " +
              "escopo com o usuário e só então implemente a Fase 1.",
            metadata: { target, bin, files: relative.length },
          }
        },
      }),

      run_quality_gates: tool({
        description:
          "Run the standard Rust console-app quality gates in a project: " +
          "fmt, clippy (with and without default features), tests (with and " +
          "without default features), xtask assets --check and release builds.",
        args: {
          path: tool.schema
            .string()
            .default(".")
            .describe("Project directory, relative to the project root"),
          quick: tool.schema
            .boolean()
            .default(false)
            .describe("Skip release builds"),
        },
        async execute(args, context) {
          const cwd = path.resolve(context.directory, args.path)
          if (!(await exists(path.join(cwd, "Cargo.toml")))) {
            throw new Error(`no Cargo.toml found in ${cwd}`)
          }

          const sh = $.cwd(cwd)
          const steps: Array<{ label: string; promise: Promise<any> }> = [
            { label: "cargo fmt --check", promise: sh`cargo fmt --check`.nothrow() },
            {
              label: "cargo clippy --workspace --all-targets -- -D warnings",
              promise: sh`cargo clippy --workspace --all-targets -- -D warnings`.nothrow(),
            },
            {
              label:
                "cargo clippy --workspace --all-targets --no-default-features -- -D warnings",
              promise: sh`cargo clippy --workspace --all-targets --no-default-features -- -D warnings`.nothrow(),
            },
            { label: "cargo test", promise: sh`cargo test`.nothrow() },
            {
              label: "cargo test --no-default-features",
              promise: sh`cargo test --no-default-features`.nothrow(),
            },
          ]

          if (await exists(path.join(cwd, "xtask", "Cargo.toml"))) {
            steps.push({
              label: "cargo xtask assets --check",
              promise: sh`cargo xtask assets --check`.nothrow(),
            })
          }

          if (!args.quick) {
            steps.push({
              label: "cargo build --release",
              promise: sh`cargo build --release`.nothrow(),
            })
            steps.push({
              label: "cargo build --release --no-default-features",
              promise: sh`cargo build --release --no-default-features`.nothrow(),
            })
          }

          const lines: string[] = []
          let failures = 0
          for (const step of steps) {
            const { code, output } = await capture(step.promise)
            if (code !== 0) failures += 1
            lines.push(
              `### ${code === 0 ? "PASS" : "FAIL"} — ${step.label} (exit ${code})`,
            )
            lines.push(output ? "```text\n" + truncate(output) + "\n```" : "_sem saída_")
            lines.push("")
          }

          return {
            title: failures === 0 ? "Portões verdes" : `${failures} portão(ões) falharam`,
            output:
              `Diretório: ${cwd}\n\n${lines.join("\n")}` +
              (failures === 0
                ? "\nTodos os portões passaram. Lembre-se: validação em hardware " +
                  "continua manual e deve ser registrada no AGENTS.md."
                : "\nCorrija as falhas acima antes de declarar a tarefa concluída."),
            metadata: { cwd, failures, steps: steps.length },
          }
        },
      }),

      framebuffer_report: tool({
        description:
          "Collect read-only framebuffer diagnostics in a reproducible report: " +
          "/proc/fb, sysfs geometry/format/blank, VT and session, permissions, " +
          "DRM driver and groups. Warns when not running on a text VT. " +
          "Optionally writes the report to a file.",
        args: {
          device: tool.schema
            .string()
            .default("/dev/fb0")
            .describe("Framebuffer device path"),
          output: tool.schema
            .string()
            .optional()
            .describe("Write the report to this path (relative to project root)"),
        },
        async execute(args, context) {
          const sh = $.cwd(context.directory)
          const tty = await capture(sh`tty`.nothrow())
          const groups = await capture(sh`id -nG`.nothrow())
          const kernel = await capture(sh`uname -a`.nothrow())
          const activeVt = await readIfExists("/sys/class/tty/tty0/active")
          const procFb = await readIfExists("/proc/fb")
          const session = {
            TERM: process.env.TERM ?? "",
            XDG_SESSION_TYPE: process.env.XDG_SESSION_TYPE ?? "",
            DISPLAY: process.env.DISPLAY ?? "",
            WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY ?? "",
          }

          const ttyValue = tty.output.split("\n")[0]?.trim() ?? ""
          const onTextVt = /^\/dev\/tty[0-9]+/.test(ttyValue)

          let deviceInfo = "(dispositivo ausente)"
          try {
            const stat = await fs.stat(args.device)
            deviceInfo =
              `mode=${(stat.mode & 0o777).toString(8)} ` +
              `uid=${stat.uid} gid=${stat.gid} size=${stat.size}`
          } catch (error) {
            deviceInfo = `(erro: ${String(error)})`
          }

          const framebuffers: string[] = []
          let graphics: string[] = []
          try {
            graphics = await fs.readdir("/sys/class/graphics")
          } catch {
            graphics = []
          }
          for (const entry of graphics
            .filter((name) => /^fb[0-9]+$/.test(name))
            .sort()) {
            const base = `/sys/class/graphics/${entry}`
            const fields: string[] = [`## ${entry}`]
            for (const field of [
              "name",
              "virtual_size",
              "bits_per_pixel",
              "stride",
              "blank",
              "modes",
              "pan",
              "rotate",
            ]) {
              fields.push(`${field}: ${await readIfExists(`${base}/${field}`)}`)
            }
            framebuffers.push(fields.join("\n"))
          }

          const lines = [
            "# Framebuffer report",
            "",
            `- data: ${new Date().toISOString()}`,
            `- kernel: ${kernel.output || "(indisponível)"}`,
            `- tty: ${ttyValue || "(indisponível)"} — VT de texto: ${onTextVt ? "sim" : "NÃO"}`,
            `- VT ativo: ${activeVt}`,
            `- grupos: ${groups.output || "(indisponível)"}`,
            `- sessão: TERM=${session.TERM || "-"} XDG_SESSION_TYPE=${session.XDG_SESSION_TYPE || "-"} DISPLAY=${session.DISPLAY || "-"} WAYLAND_DISPLAY=${session.WAYLAND_DISPLAY || "-"}`,
            `- ${args.device}: ${deviceInfo}`,
            "",
            "## /proc/fb",
            "```text",
            procFb,
            "```",
            "",
            ...framebuffers,
            "",
            "## Interpretação",
            onTextVt
              ? "- Execute o app com `--backend fb` e confirme que `blank` chega a 0 sem Ctrl+C."
              : "- AVISO: fora de um VT de texto o teste não exercita o framebuffer e gera falso negativo. Rode em `/dev/ttyN`.",
            groups.output.split(/\s+/).includes("video")
              ? "- O usuário pertence ao grupo `video`."
              : "- O usuário NÃO pertence ao grupo `video`; use `sudo usermod -aG video $USER` e faça novo login.",
            "- Se a tela ficar em branco, suspeite de blank/DPMS antes de mudar o código.",
          ]

          const report = lines.join("\n")
          let written = ""
          if (args.output) {
            const destination = path.resolve(context.directory, args.output)
            await fs.writeFile(destination, report)
            written = `\n\nRelatório gravado em ${destination}`
          }

          return {
            title: onTextVt
              ? "Framebuffer report (VT)"
              : "Framebuffer report (fora de VT)",
            output: report + written,
            metadata: { device: args.device, onTextVt, output: args.output ?? null },
          }
        },
      }),
    },
  }
}

export default ConsoleAppPlugin
